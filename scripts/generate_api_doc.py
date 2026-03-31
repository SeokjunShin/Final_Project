from __future__ import annotations

import json
import re
import shutil
import zipfile
from dataclasses import dataclass, field
from datetime import date
from pathlib import Path
from typing import Dict, Iterable, List, Optional, Tuple
from xml.etree import ElementTree as ET


ROOT = Path(__file__).resolve().parents[1]
BACKEND_JAVA = ROOT / "backend" / "src" / "main" / "java"
CONTROLLER_DIR = BACKEND_JAVA / "com" / "mycard" / "api" / "controller"
DOC_PATH = ROOT / "docs" / "SESAC_WEB_API_기능정의서.docx"

NS = "http://schemas.openxmlformats.org/wordprocessingml/2006/main"
ET.register_namespace("w", NS)


@dataclass
class JavaType:
    raw: str
    base: str
    args: List["JavaType"] = field(default_factory=list)
    array_dims: int = 0

    @classmethod
    def parse(cls, raw: str) -> "JavaType":
        text = raw.strip()
        text = re.sub(r"@\w+(?:\([^)]*\))?\s*", "", text)
        text = re.sub(r"\bfinal\s+", "", text)
        array_dims = text.count("[]")
        text = text.replace("[]", "").strip()
        if "<" not in text:
            return cls(raw=text, base=text, args=[], array_dims=array_dims)

        base, arg_text = text.split("<", 1)
        arg_text = arg_text.rsplit(">", 1)[0]
        return cls(raw=text, base=base.strip(), args=parse_generic_args(arg_text), array_dims=array_dims)


@dataclass
class FieldInfo:
    name: str
    java_type: JavaType


@dataclass
class TypeInfo:
    name: str
    qualified_name: str
    kind: str
    fields: List[FieldInfo] = field(default_factory=list)
    enum_values: List[str] = field(default_factory=list)
    imports: Dict[str, str] = field(default_factory=dict)
    nested: Dict[str, str] = field(default_factory=dict)


@dataclass
class ParamInfo:
    kind: str
    name: str
    java_type: JavaType
    required: bool = True
    default: Optional[str] = None
    annotation_value: Optional[str] = None


@dataclass
class Endpoint:
    group: str
    group_description: str
    controller: str
    method: str
    uri: str
    summary: str
    detail: str
    response_type: JavaType
    params: List[ParamInfo]


def parse_generic_args(text: str) -> List[JavaType]:
    args: List[str] = []
    current: List[str] = []
    depth = 0
    for ch in text:
        if ch == "<":
            depth += 1
        elif ch == ">":
            depth -= 1
        elif ch == "," and depth == 0:
            args.append("".join(current).strip())
            current = []
            continue
        current.append(ch)
    if current:
        args.append("".join(current).strip())
    return [JavaType.parse(arg) for arg in args if arg]


def parse_java_types() -> Dict[str, TypeInfo]:
    type_map: Dict[str, TypeInfo] = {}
    for java_file in sorted((BACKEND_JAVA / "com" / "mycard" / "api").rglob("*.java")):
        if "controller" in java_file.parts:
            continue
        content = java_file.read_text(encoding="utf-8")
        package_match = re.search(r"package\s+([\w.]+);", content)
        package_name = package_match.group(1) if package_match else ""
        imports = {
            imp.split(".")[-1]: imp
            for imp in re.findall(r"import\s+([\w.]+);", content)
        }

        top_match = re.search(r"\b(class|enum)\s+(\w+)", content)
        if not top_match:
            continue
        top_kind, top_name = top_match.groups()
        top_qualified = f"{package_name}.{top_name}"

        top_info = TypeInfo(
            name=top_name,
            qualified_name=top_qualified,
            kind="enum" if top_kind == "enum" else "class",
            imports=imports,
        )

        if top_kind == "enum":
            top_info.enum_values = parse_enum_values(content, top_name)
        else:
            top_info.fields = parse_fields(content)

        nested_types = parse_nested_types(content, package_name, top_name, imports)
        for nested in nested_types.values():
            type_map[nested.qualified_name] = nested
            type_map[nested.name] = nested
            top_info.nested[nested.name] = nested.qualified_name

        type_map[top_qualified] = top_info
        type_map[top_name] = top_info
    return type_map


def parse_enum_values(content: str, enum_name: str) -> List[str]:
    enum_match = re.search(rf"enum\s+{re.escape(enum_name)}\s*\{{(.*?)\}}", content, re.S)
    if not enum_match:
        return []
    body = enum_match.group(1)
    head = body.split(";", 1)[0]
    values = []
    for piece in head.split(","):
        candidate = piece.strip()
        if not candidate or "(" in candidate or "{" in candidate:
            continue
        candidate = re.sub(r"\s.*", "", candidate)
        if candidate:
            values.append(candidate)
    return values


def parse_nested_types(content: str, package_name: str, top_name: str, imports: Dict[str, str]) -> Dict[str, TypeInfo]:
    nested: Dict[str, TypeInfo] = {}
    pattern = re.compile(r"\b(static\s+)?(class|enum)\s+(\w+)\s*\{", re.S)
    for match in pattern.finditer(content):
        kind = match.group(2)
        name = match.group(3)
        start = match.end() - 1
        body, _ = extract_block(content, start)
        qualified_name = f"{package_name}.{top_name}.{name}"
        info = TypeInfo(
            name=name,
            qualified_name=qualified_name,
            kind="enum" if kind == "enum" else "class",
            imports=imports,
        )
        if kind == "enum":
            info.enum_values = parse_enum_values(body, name)
        else:
            info.fields = parse_fields(body)
        nested[name] = info
    return nested


def parse_fields(content: str) -> List[FieldInfo]:
    fields: List[FieldInfo] = []
    for line in content.splitlines():
        stripped = line.strip()
        if not stripped.startswith("private "):
            continue
        if "(" in stripped or ")" in stripped:
            continue
        match = re.match(r"private\s+(.+?)\s+(\w+)\s*(?:=.*)?;", stripped)
        if not match:
            continue
        type_text, name = match.groups()
        fields.append(FieldInfo(name=name, java_type=JavaType.parse(type_text)))
    return fields


def extract_block(text: str, brace_start: int) -> Tuple[str, int]:
    depth = 0
    for idx in range(brace_start, len(text)):
        char = text[idx]
        if char == "{":
            depth += 1
        elif char == "}":
            depth -= 1
            if depth == 0:
                return text[brace_start:idx + 1], idx + 1
    return text[brace_start:], len(text)


def parse_controllers(type_map: Dict[str, TypeInfo]) -> List[Endpoint]:
    endpoints: List[Endpoint] = []
    for java_file in sorted(CONTROLLER_DIR.glob("*.java")):
        content = java_file.read_text(encoding="utf-8")
        tag_match = re.search(r'@Tag\(name\s*=\s*"([^"]+)"(?:,\s*description\s*=\s*"([^"]*)")?', content)
        group = tag_match.group(1) if tag_match else java_file.stem.replace("Controller", "")
        group_desc = tag_match.group(2) if tag_match and tag_match.group(2) else group
        prefix_match = re.search(r'@RequestMapping\("([^"]+)"\)', content)
        prefix = prefix_match.group(1) if prefix_match else ""
        lines = content.splitlines()
        pending_annotations: List[str] = []
        idx = 0
        while idx < len(lines):
            line = lines[idx].strip()
            if line.startswith("@"):
                pending_annotations.append(lines[idx])
                idx += 1
                continue
            if "public ResponseEntity<" in line:
                signature_lines = [lines[idx]]
                while idx + 1 < len(lines) and "{" not in signature_lines[-1]:
                    idx += 1
                    signature_lines.append(lines[idx])
                signature = " ".join(part.strip() for part in signature_lines)
                annotations = "\n".join(pending_annotations)
                pending_annotations = []
                mapping = re.search(
                    r'@(?P<method>Get|Post|Put|Patch|Delete)Mapping(?:\((?P<args>[^)]*)\))?',
                    annotations,
                    re.S,
                )
                if not mapping:
                    idx += 1
                    continue
                method = mapping.group("method").upper()
                args = mapping.group("args") or ""
                sub_path = extract_mapping_path(args)
                summary, detail = extract_operation(annotations)
                response_text, method_name, param_text = parse_signature(signature)
                params = parse_method_params(param_text)
                response_type = JavaType.parse(response_text)

                endpoints.append(
                    Endpoint(
                        group=group,
                        group_description=group_desc,
                        controller=java_file.name,
                        method=method,
                        uri=prefix + sub_path,
                        summary=summary or humanize_method_name(method_name),
                        detail=detail,
                        response_type=response_type,
                        params=params,
                    )
                )
            else:
                pending_annotations = []
            idx += 1
    return endpoints


def parse_signature(signature: str) -> Tuple[str, str, str]:
    start = signature.index("ResponseEntity<") + len("ResponseEntity<")
    depth = 1
    pos = start
    while pos < len(signature):
        if signature[pos] == "<":
            depth += 1
        elif signature[pos] == ">":
            depth -= 1
            if depth == 0:
                break
        pos += 1
    response_text = signature[start:pos]
    remainder = signature[pos + 1:].strip()
    name_match = re.match(r"(\w+)\s*\((.*)\)\s*\{?", remainder)
    if not name_match:
        raise ValueError(f"메서드 시그니처 파싱 실패: {signature}")
    return response_text.strip(), name_match.group(1).strip(), name_match.group(2).strip()


def extract_mapping_path(args: str) -> str:
    if not args.strip():
        return ""
    value_match = re.search(r'value\s*=\s*"([^"]*)"', args)
    if value_match:
        return value_match.group(1)
    string_match = re.search(r'"([^"]*)"', args)
    return string_match.group(1) if string_match else ""


def extract_operation(annotations: str) -> Tuple[str, str]:
    op_match = re.search(r'@Operation\((.*?)\)', annotations, re.S)
    if not op_match:
        return "", ""
    body = op_match.group(1)
    summary_match = re.search(r'summary\s*=\s*"([^"]*)"', body, re.S)
    detail_match = re.search(r'description\s*=\s*"([^"]*)"', body, re.S)
    return (
        summary_match.group(1).strip() if summary_match else "",
        detail_match.group(1).strip() if detail_match else "",
    )


def parse_method_params(raw_params: str) -> List[ParamInfo]:
    params: List[ParamInfo] = []
    for chunk in split_params(raw_params):
        text = " ".join(chunk.strip().split())
        if not text or "@AuthenticationPrincipal" in text or "@CurrentUser" in text:
            continue

        kind = "other"
        required = True
        default = None
        annotation_value = None

        req_param = re.search(r"@RequestParam(?:\(([^)]*)\))?", text)
        path_var = re.search(r"@PathVariable(?:\(([^)]*)\))?", text)
        request_body = "@RequestBody" in text
        request_header = re.search(r"@RequestHeader(?:\(([^)]*)\))?", text)

        if req_param:
            kind = "query"
            required = not re.search(r"required\s*=\s*false", req_param.group(1) or "")
            default_match = re.search(r'defaultValue\s*=\s*"([^"]*)"', req_param.group(1) or "")
            if default_match:
                default = default_match.group(1)
            value_match = re.search(r'(?:value|name)\s*=\s*"([^"]+)"', req_param.group(1) or "")
            if not value_match and re.fullmatch(r'\s*"([^"]+)"\s*', req_param.group(1) or ""):
                value_match = re.search(r'"([^"]+)"', req_param.group(1) or "")
            if value_match:
                annotation_value = value_match.group(1)
        elif path_var:
            kind = "path"
            value_match = re.search(r'(?:value|name)\s*=\s*"([^"]+)"', path_var.group(1) or "")
            if not value_match and re.fullmatch(r'\s*"([^"]+)"\s*', path_var.group(1) or ""):
                value_match = re.search(r'"([^"]+)"', path_var.group(1) or "")
            if value_match:
                annotation_value = value_match.group(1)
        elif request_body:
            kind = "body"
        elif request_header:
            kind = "header"
            required = not re.search(r"required\s*=\s*false", request_header.group(1) or "")
            value_match = re.search(r'(?:value|name)\s*=\s*"([^"]+)"', request_header.group(1) or "")
            if not value_match and re.fullmatch(r'\s*"([^"]+)"\s*', request_header.group(1) or ""):
                value_match = re.search(r'"([^"]+)"', request_header.group(1) or "")
            if value_match:
                annotation_value = value_match.group(1)
        elif "Pageable" in text:
            params.extend(
                [
                    ParamInfo("query", "page", JavaType.parse("int"), required=False, default="0"),
                    ParamInfo("query", "size", JavaType.parse("int"), required=False, default="20"),
                    ParamInfo("query", "sort", JavaType.parse("String"), required=False),
                ]
            )
            continue
        else:
            continue

        cleaned = re.sub(r"@\w+(?:\([^)]*\))?\s*", "", text)
        cleaned = re.sub(r"\bfinal\s+", "", cleaned).strip()
        match = re.match(r"(.+?)\s+(\w+)$", cleaned)
        if not match:
            continue
        type_text, name = match.groups()
        param_name = annotation_value or name
        params.append(
            ParamInfo(
                kind=kind,
                name=param_name,
                java_type=JavaType.parse(type_text),
                required=required,
                default=default,
                annotation_value=annotation_value,
            )
        )
    return params


def split_params(raw: str) -> List[str]:
    if not raw.strip():
        return []
    pieces: List[str] = []
    current: List[str] = []
    depth_paren = 0
    depth_angle = 0
    for ch in raw:
        if ch == "(":
            depth_paren += 1
        elif ch == ")":
            depth_paren -= 1
        elif ch == "<":
            depth_angle += 1
        elif ch == ">":
            depth_angle -= 1
        elif ch == "," and depth_paren == 0 and depth_angle == 0:
            pieces.append("".join(current))
            current = []
            continue
        current.append(ch)
    if current:
        pieces.append("".join(current))
    return pieces


def humanize_method_name(name: str) -> str:
    parts = re.findall(r"[A-Z]?[a-z]+|[A-Z]+(?=[A-Z]|$)", name)
    return " ".join(parts) if parts else name


def resolve_type(type_map: Dict[str, TypeInfo], java_type: JavaType, owner: Optional[TypeInfo] = None) -> Optional[TypeInfo]:
    candidates = [java_type.base]
    if owner:
        if java_type.base in owner.nested:
            candidates.insert(0, owner.nested[java_type.base])
        if java_type.base in owner.imports:
            candidates.insert(0, owner.imports[java_type.base])
    for candidate in candidates:
        if candidate in type_map:
            return type_map[candidate]
    return None


def sample_value(type_map: Dict[str, TypeInfo], java_type: JavaType, owner: Optional[TypeInfo] = None, field_name: str = ""):
    base = java_type.base

    if java_type.array_dims > 0:
        return [sample_value(type_map, JavaType.parse(base), owner, field_name)]
    if base in {"String", "CharSequence"}:
        return sample_string(field_name)
    if base in {"Long", "Integer", "int", "long", "Short", "short"}:
        return 0
    if base in {"Double", "Float", "BigDecimal", "double", "float"}:
        return 0
    if base in {"Boolean", "boolean"}:
        return True
    if base in {"LocalDate"}:
        return "date"
    if base in {"LocalDateTime", "Instant", "OffsetDateTime"}:
        return "date-time"
    if base in {"byte[]", "Resource"}:
        return "binary"
    if base == "MultipartFile":
        return "binary"
    if base in {"List", "Set"} and java_type.args:
        return [sample_value(type_map, java_type.args[0], owner, field_name)]
    if base == "Page" and java_type.args:
        return {
            "content": [sample_value(type_map, java_type.args[0], owner, field_name)],
            "page": {
                "number": 0,
                "size": 20,
                "totalElements": 1,
                "totalPages": 1,
            },
        }
    if base == "Map":
        if field_name:
            return {field_name: "value"}
        return {"key": "value"}

    type_info = resolve_type(type_map, java_type, owner)
    if type_info:
        if type_info.kind == "enum":
            return "enum"
        result = {}
        for field in type_info.fields:
            result[field.name] = sample_value(type_map, field.java_type, type_info, field.name)
        return result
    return "object"


def sample_string(field_name: str) -> str:
    return "string"


def build_request_example(type_map: Dict[str, TypeInfo], endpoint: Endpoint) -> Optional[str]:
    body_params = [param for param in endpoint.params if param.kind == "body"]
    header_params = [param for param in endpoint.params if param.kind == "header"]
    multipart_params = [param for param in endpoint.params if param.java_type.base == "MultipartFile"]

    parts: List[str] = []
    if header_params:
        parts.append("Headers")
        for param in header_params:
            suffix = " (optional)" if not param.required else ""
            parts.append(f"- {param.name}: {param.java_type.base}{suffix}")
    if multipart_params:
        parts.append("multipart/form-data")
        payload = {}
        for param in multipart_params:
            payload[param.name] = "binary"
        for param in endpoint.params:
            if param.kind == "query":
                payload[param.name] = sample_value(type_map, param.java_type, field_name=param.name)
        parts.append(json.dumps(payload, ensure_ascii=False, indent=2))
    elif body_params:
        body = sample_value(type_map, body_params[0].java_type)
        parts.append(json.dumps(body, ensure_ascii=False, indent=2))

    return "\n".join(parts) if parts else None


def build_response_example(type_map: Dict[str, TypeInfo], endpoint: Endpoint) -> str:
    response = endpoint.response_type
    if response.base == "Void":
        return "200 OK\n(no response body)"
    if response.base == "Resource" or response.base == "byte":
        return "200 OK\n(binary response)"
    payload = sample_value(type_map, response)
    return "200 OK\n" + json.dumps(payload, ensure_ascii=False, indent=2)


def endpoint_sort_key(endpoint: Endpoint) -> Tuple[str, str, str]:
    return (endpoint.group, endpoint.uri, endpoint.method)


def escape_xml(text: str) -> str:
    return (
        text.replace("&", "&amp;")
        .replace("<", "&lt;")
        .replace(">", "&gt;")
    )


def run_element(text: str, size: Optional[int] = None, bold: bool = False) -> str:
    props = []
    if bold:
        props.append("<w:b/>")
    if size is not None:
        props.append(f'<w:sz w:val="{size}"/><w:szCs w:val="{size}"/>')
    rpr = f"<w:rPr>{''.join(props)}</w:rPr>" if props else ""
    return f"<w:r>{rpr}<w:t xml:space=\"preserve\">{escape_xml(text)}</w:t></w:r>"


def paragraph(
    text: str = "",
    size: Optional[int] = None,
    bold: bool = False,
    center: bool = False,
    keep_next: bool = False,
) -> str:
    ppr_parts: List[str] = []
    if keep_next:
        ppr_parts.append("<w:keepNext/>")
    if center:
        ppr_parts.append("<w:jc w:val=\"center\"/>")
    ppr = f"<w:pPr>{''.join(ppr_parts)}</w:pPr>" if ppr_parts else ""
    if not text:
        return f"<w:p>{ppr}</w:p>"
    return f"<w:p>{ppr}{run_element(text, size=size, bold=bold)}</w:p>"


def cell_paragraphs(text: str, monospace: bool = False) -> str:
    if not text:
        return "<w:p/>"
    runs = []
    lines = text.splitlines()
    for idx, line in enumerate(lines):
        keep_next = idx < len(lines) - 1
        if monospace:
            runs.append(
                "<w:p><w:pPr>"
                + ("<w:keepNext/>" if keep_next else "")
                + "</w:pPr><w:r><w:rPr>"
                "<w:rFonts w:ascii=\"Consolas\" w:hAnsi=\"Consolas\"/>"
                "<w:sz w:val=\"18\"/><w:szCs w:val=\"18\"/>"
                "</w:rPr>"
                f"<w:t xml:space=\"preserve\">{escape_xml(line)}</w:t></w:r></w:p>"
            )
        else:
            runs.append(paragraph(line, size=18, keep_next=keep_next))
    return "".join(runs)


def table_cell(text: str, width: int, fill: Optional[str] = None, grid_span: int = 1, monospace: bool = False) -> str:
    tcpr = [f'<w:tcW w:w="{width}" w:type="dxa"/>']
    if fill:
        tcpr.append(f'<w:shd w:val="clear" w:color="auto" w:fill="{fill}"/>')
    if grid_span > 1:
        tcpr.append(f'<w:gridSpan w:val="{grid_span}"/>')
    return f"<w:tc><w:tcPr>{''.join(tcpr)}</w:tcPr>{cell_paragraphs(text, monospace=monospace)}</w:tc>"


def table_row(*cells: str) -> str:
    return f"<w:tr><w:trPr><w:cantSplit/></w:trPr>{''.join(cells)}</w:tr>"


def summary_table(endpoint: Endpoint, request_body: Optional[str], response_body: str) -> str:
    return (
        "<w:tbl>"
        "<w:tblPr><w:tblStyle w:val=\"aa\"/><w:tblW w:w=\"0\" w:type=\"auto\"/>"
        "<w:tblLayout w:type=\"fixed\"/>"
        "<w:tblLook w:val=\"04A0\" w:firstRow=\"1\" w:lastRow=\"0\" w:firstColumn=\"1\" "
        "w:lastColumn=\"0\" w:noHBand=\"0\" w:noVBand=\"1\"/></w:tblPr>"
        "<w:tblGrid><w:gridCol w:w=\"1560\"/><w:gridCol w:w=\"4925\"/><w:gridCol w:w=\"2531\"/></w:tblGrid>"
        + table_row(
            f"{table_cell('Method', 1560, fill='BFBFBF')}"
            f"{table_cell('Uri', 4925, fill='BFBFBF')}"
            f"{table_cell('Description', 2531, fill='BFBFBF')}"
        )
        + table_row(
            f"{table_cell(endpoint.method, 1560)}"
            f"{table_cell(endpoint.uri, 4925)}"
            f"{table_cell(endpoint.summary, 2531)}"
        )
        + detail_rows(endpoint, request_body, response_body)
        + "</w:tbl>"
    )


def detail_rows(endpoint: Endpoint, request_body: Optional[str], response_body: str) -> str:
    rows: List[str] = []
    parameter_lines: List[str] = []
    for param in endpoint.params:
        if param.kind in {"path", "query", "header"}:
            label = {
                "path": "path",
                "query": "query",
                "header": "header",
            }[param.kind]
            optional = " optional" if not param.required else ""
            default = f" default={param.default}" if param.default is not None else ""
            parameter_lines.append(f"{label} {param.name}: {param.java_type.base}{optional}{default}")

    if parameter_lines:
        rows.append(
            table_row(
                f"{table_cell('Parameters', 1560)}"
                f"{table_cell(chr(10).join(parameter_lines), 7456, grid_span=2, monospace=True)}"
            )
        )

    if request_body:
        rows.append(
            table_row(
                f"{table_cell('Request body', 1560)}"
                f"{table_cell(request_body, 7456, grid_span=2, monospace=True)}"
            )
        )

    rows.append(
        table_row(
            f"{table_cell('Response', 1560)}"
            f"{table_cell(response_body, 7456, grid_span=2, monospace=True)}"
        )
    )
    return "".join(rows)


def build_document_xml(endpoints: List[Endpoint], type_map: Dict[str, TypeInfo], template_bytes: bytes) -> bytes:
    template_root = ET.fromstring(template_bytes)
    body = template_root.find(f"{{{NS}}}body")
    sect_pr = body.find(f"{{{NS}}}sectPr")

    parts: List[str] = []
    parts.append(paragraph("Web/API 기능 정의서 (MyCard)", size=48, bold=False, center=True))
    parts.extend(paragraph() for _ in range(2))
    parts.append(metadata_table())
    parts.append(paragraph())
    parts.append(paragraph(f"갱신 기준: {date.today().isoformat()} / backend 컨트롤러 구현 기준 전체 재정리", size=20))
    parts.append(paragraph("문서 범위: 사용자 포털, 관리자 포털, 운영자 포털, 공용 API", size=20))
    parts.append(paragraph())

    grouped: Dict[str, List[Endpoint]] = {}
    descriptions: Dict[str, str] = {}
    for endpoint in sorted(endpoints, key=endpoint_sort_key):
        grouped.setdefault(endpoint.group, []).append(endpoint)
        descriptions.setdefault(endpoint.group, endpoint.group_description)

    for group, items in grouped.items():
        parts.append(paragraph(f"{group} - {descriptions[group]}", size=32, bold=True))
        parts.append(paragraph())
        for endpoint in items:
            request_body = build_request_example(type_map, endpoint)
            response_body = build_response_example(type_map, endpoint)
            parts.append(summary_table(endpoint, request_body, response_body))
            parts.append(paragraph())

    sect_xml = ET.tostring(sect_pr, encoding="unicode") if sect_pr is not None else (
        '<w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1701" w:right="1440" '
        'w:bottom="1440" w:left="1440" w:header="851" w:footer="992" w:gutter="0"/>'
        '<w:cols w:space="425"/><w:docGrid w:linePitch="360"/></w:sectPr>'
    )

    return (
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
        '<w:document xmlns:wpc="http://schemas.microsoft.com/office/word/2010/wordprocessingCanvas" '
        'xmlns:cx="http://schemas.microsoft.com/office/drawing/2014/chartex" '
        'xmlns:cx1="http://schemas.microsoft.com/office/drawing/2015/9/8/chartex" '
        'xmlns:cx2="http://schemas.microsoft.com/office/drawing/2015/10/21/chartex" '
        'xmlns:cx3="http://schemas.microsoft.com/office/drawing/2016/5/9/chartex" '
        'xmlns:cx4="http://schemas.microsoft.com/office/drawing/2016/5/10/chartex" '
        'xmlns:cx5="http://schemas.microsoft.com/office/drawing/2016/5/11/chartex" '
        'xmlns:cx6="http://schemas.microsoft.com/office/drawing/2016/5/12/chartex" '
        'xmlns:cx7="http://schemas.microsoft.com/office/drawing/2016/5/13/chartex" '
        'xmlns:cx8="http://schemas.microsoft.com/office/drawing/2016/5/14/chartex" '
        'xmlns:mc="http://schemas.openxmlformats.org/markup-compatibility/2006" '
        'xmlns:aink="http://schemas.microsoft.com/office/drawing/2016/ink" '
        'xmlns:am3d="http://schemas.microsoft.com/office/drawing/2017/model3d" '
        'xmlns:o="urn:schemas-microsoft-com:office:office" '
        'xmlns:oel="http://schemas.microsoft.com/office/2019/extlst" '
        'xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" '
        'xmlns:m="http://schemas.openxmlformats.org/officeDocument/2006/math" '
        'xmlns:v="urn:schemas-microsoft-com:vml" '
        'xmlns:wp14="http://schemas.microsoft.com/office/word/2010/wordprocessingDrawing" '
        'xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing" '
        'xmlns:w10="urn:schemas-microsoft-com:office:word" '
        f'xmlns:w="{NS}" '
        'xmlns:w14="http://schemas.microsoft.com/office/word/2010/wordml" '
        'xmlns:w15="http://schemas.microsoft.com/office/word/2012/wordml" '
        'xmlns:w16cex="http://schemas.microsoft.com/office/word/2018/wordml/cex" '
        'xmlns:w16cid="http://schemas.microsoft.com/office/word/2016/wordml/cid" '
        'xmlns:w16="http://schemas.microsoft.com/office/word/2018/wordml" '
        'xmlns:w16du="http://schemas.microsoft.com/office/word/2023/wordml/word16du" '
        'xmlns:w16sdtdh="http://schemas.microsoft.com/office/word/2020/wordml/sdtdatahash" '
        'xmlns:w16sdtfl="http://schemas.microsoft.com/office/word/2024/wordml/sdtformatlock" '
        'xmlns:w16se="http://schemas.microsoft.com/office/word/2015/wordml/symex" '
        'xmlns:wpg="http://schemas.microsoft.com/office/word/2010/wordprocessingGroup" '
        'xmlns:wpi="http://schemas.microsoft.com/office/word/2010/wordprocessingInk" '
        'xmlns:wne="http://schemas.openxmlformats.org/officeDocument/2006/wordml" '
        'xmlns:wps="http://schemas.microsoft.com/office/word/2010/wordprocessingShape" '
        'mc:Ignorable="w14 w15 w16se w16cid w16 w16cex w16sdtdh w16sdtfl w16du">'
        f'<w:body>{"".join(parts)}{sect_xml}</w:body></w:document>'
    ).encode("utf-8")


def metadata_table() -> str:
    return (
        "<w:tbl>"
        "<w:tblPr><w:tblStyle w:val=\"aa\"/><w:tblW w:w=\"0\" w:type=\"auto\"/>"
        "<w:tblLook w:val=\"04A0\" w:firstRow=\"1\" w:lastRow=\"0\" w:firstColumn=\"1\" "
        "w:lastColumn=\"0\" w:noHBand=\"0\" w:noVBand=\"1\"/></w:tblPr>"
        "<w:tblGrid><w:gridCol w:w=\"1838\"/><w:gridCol w:w=\"7178\"/></w:tblGrid>"
        "<w:tr>"
        f"{table_cell('문서명', 1838)}"
        f"{table_cell('MyCard API 기능 정의서', 7178)}"
        "</w:tr>"
        "<w:tr>"
        f"{table_cell('작성일', 1838)}"
        f"{table_cell(date.today().isoformat(), 7178)}"
        "</w:tr>"
        "<w:tr>"
        f"{table_cell('대상 시스템', 1838)}"
        f"{table_cell('사용자 포털(frontend-user) + 관리자 포털(frontend-admin) + API 서버(backend)', 7178)}"
        "</w:tr>"
        "<w:tr>"
        f"{table_cell('API Gateway', 1838)}"
        f"{table_cell('/api (예: GET /api/dashboard/summary)', 7178)}"
        "</w:tr>"
        "</w:tbl>"
    )


def rewrite_docx(document_xml: bytes) -> None:
    temp_path = DOC_PATH.with_suffix(".tmp.docx")
    with zipfile.ZipFile(DOC_PATH, "r") as source, zipfile.ZipFile(temp_path, "w", zipfile.ZIP_DEFLATED) as target:
        for item in source.infolist():
            data = source.read(item.filename)
            if item.filename == "word/document.xml":
                data = document_xml
            target.writestr(item, data)
    shutil.move(temp_path, DOC_PATH)


def main() -> None:
    if not DOC_PATH.exists():
        raise SystemExit(f"문서 파일을 찾을 수 없습니다: {DOC_PATH}")

    type_map = parse_java_types()
    endpoints = parse_controllers(type_map)

    with zipfile.ZipFile(DOC_PATH, "r") as source:
        template_xml = source.read("word/document.xml")

    new_document_xml = build_document_xml(endpoints, type_map, template_xml)
    rewrite_docx(new_document_xml)
    print(f"updated: {DOC_PATH}")
    print(f"endpoint_count: {len(endpoints)}")


if __name__ == "__main__":
    main()
