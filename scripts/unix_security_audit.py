#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
주요정보통신기반시설 기술적 취약점 분석·평가 - Unix/Linux 서버 자동진단 도구
============================================================================
기준: 주요정보통신기반시설 기술적 취약점 분석·평가 상세가이드 (U-01 ~ U-67)
작성: 보안 자동진단 Python 스크립트
실행: root 권한으로 실행 (sudo python3 unix_security_audit.py)
주의: 읽기 전용 점검만 수행하며, 시스템을 변경하지 않음
"""

import inspect
import json
import os
import re
import stat
import subprocess
import sys
import datetime
import platform
import pwd
import grp
from pathlib import Path
from collections import Counter

# ──────────────────────────────────────────────
# 공통 유틸리티
# ──────────────────────────────────────────────

TIMEOUT = 15  # subprocess 기본 timeout(초)

def run_cmd(cmd, timeout=TIMEOUT, shell=True):
    """명령 실행 후 (returncode, stdout, stderr) 반환. 예외 안전."""
    try:
        r = subprocess.run(
            cmd, shell=shell, capture_output=True, text=True, timeout=timeout
        )
        return r.returncode, r.stdout.strip(), r.stderr.strip()
    except subprocess.TimeoutExpired:
        return -1, "", "TIMEOUT"
    except PermissionError:
        return -2, "", "PERMISSION_DENIED"
    except Exception as e:
        return -99, "", str(e)


def read_file_contents(path):
    """파일 내용 읽기. 없으면 None."""
    try:
        with open(path, "r", encoding="utf-8", errors="replace") as f:
            return f.read()
    except (FileNotFoundError, PermissionError, OSError):
        return None


def file_stat(path):
    """os.stat 래퍼. 없으면 None."""
    try:
        return os.stat(path)
    except (FileNotFoundError, PermissionError, OSError):
        return None


def file_owner_and_perm(path):
    """(owner_name, octal_perm) 반환. 실패 시 (None, None)."""
    st = file_stat(path)
    if st is None:
        return None, None
    try:
        owner = pwd.getpwuid(st.st_uid).pw_name
    except KeyError:
        owner = str(st.st_uid)
    perm = oct(stat.S_IMODE(st.st_mode))
    return owner, perm


def perm_le(actual_oct_str, max_oct_str):
    """actual 권한이 max 이하인지 판정 (예: '0o644' <= '0o644')."""
    return int(actual_oct_str, 8) <= int(max_oct_str, 8)


def detect_distro():
    """'redhat' 또는 'debian' 반환. 판별 실패 시 'unknown'."""
    if os.path.isfile("/etc/redhat-release"):
        return "redhat"
    if os.path.isfile("/etc/debian_version"):
        return "debian"
    rc, out, _ = run_cmd("cat /etc/os-release 2>/dev/null")
    if rc == 0:
        low = out.lower()
        if any(k in low for k in ("rhel", "centos", "fedora", "rocky", "alma", "oracle")):
            return "redhat"
        if any(k in low for k in ("ubuntu", "debian", "mint", "kali")):
            return "debian"
    return "unknown"


def is_service_active(name):
    """systemctl 기반 서비스 활성 여부."""
    rc, out, _ = run_cmd(f"systemctl is-active {name} 2>/dev/null")
    return out.strip() == "active"


def is_service_enabled(name):
    rc, out, _ = run_cmd(f"systemctl is-enabled {name} 2>/dev/null")
    return out.strip() == "enabled"


def service_running_any(names):
    """여러 서비스명 중 하나라도 active이면 True."""
    for n in names:
        if is_service_active(n):
            return True
    return False


def process_running(pattern):
    """ps -ef 에서 패턴 검색."""
    rc, out, _ = run_cmd(f"ps -ef 2>/dev/null | grep -E '{pattern}' | grep -v grep")
    return bool(out.strip())


def result_dict(code, name, importance, status, evidence, purpose=""):
    """결과 dict 생성."""
    return {
        "항목코드": code,
        "항목명": name,
        "중요도": importance,
        "판정": status,       # 양호 / 취약 / N/A / 수동점검필요
        "점검목적": purpose,
        "evidence": evidence,
    }


DISTRO = detect_distro()

# ──────────────────────────────────────────────
# U-01  root 계정 원격 접속 제한
# ──────────────────────────────────────────────
def check_u01():
    code, name, imp = "U-01", "root 계정 원격 접속 제한", "상"
    purpose = "관리자 계정 탈취로 인한 시스템 장악을 방지하기 위해 root 원격 접속을 차단"
    evidence = {}

    # SSH PermitRootLogin 점검
    sshd_conf = read_file_contents("/etc/ssh/sshd_config")
    if sshd_conf is None:
        evidence["sshd_config"] = "파일 없음"
        ssh_ok = True  # SSH 미사용
    else:
        match = re.search(r"^\s*PermitRootLogin\s+(\S+)", sshd_conf, re.MULTILINE | re.IGNORECASE)
        if match:
            val = match.group(1).lower()
            evidence["PermitRootLogin"] = val
            ssh_ok = val in ("no", "prohibit-password", "forced-commands-only")
        else:
            evidence["PermitRootLogin"] = "설정 없음(기본값 사용)"
            ssh_ok = False  # 기본값은 yes일 수 있음

    # Telnet 서비스 점검
    telnet_active = is_service_active("telnet.socket") or is_service_active("telnetd") or process_running("in.telnetd|telnetd")
    evidence["telnet_active"] = telnet_active

    if telnet_active:
        # securetty에 pts 있는지 확인
        sec = read_file_contents("/etc/securetty")
        if sec:
            pts_lines = [l.strip() for l in sec.splitlines() if l.strip().startswith("pts/")]
            evidence["securetty_pts"] = pts_lines
            telnet_ok = len(pts_lines) == 0
        else:
            evidence["securetty"] = "파일 없음(최근 OS는 기본 비활성화)"
            telnet_ok = True
    else:
        telnet_ok = True

    status = "양호" if (ssh_ok and telnet_ok) else "취약"
    return result_dict(code, name, imp, status, evidence, purpose)


# ──────────────────────────────────────────────
# U-02  비밀번호 관리정책 설정
# ──────────────────────────────────────────────
def check_u02():
    code, name, imp = "U-02", "비밀번호 관리정책 설정", "상"
    purpose = "비밀번호 복잡성과 주기적 변경을 통해 시스템 보안 강화"
    evidence = {}
    vuln_reasons = []

    # /etc/login.defs
    defs = read_file_contents("/etc/login.defs")
    if defs:
        for key in ("PASS_MAX_DAYS", "PASS_MIN_DAYS", "PASS_MIN_LEN"):
            m = re.search(rf"^\s*{key}\s+(\d+)", defs, re.MULTILINE)
            if m:
                evidence[key] = int(m.group(1))
            else:
                evidence[key] = "미설정"
        if isinstance(evidence.get("PASS_MAX_DAYS"), int) and evidence["PASS_MAX_DAYS"] > 90:
            vuln_reasons.append("PASS_MAX_DAYS > 90")
        if evidence.get("PASS_MAX_DAYS") == "미설정":
            vuln_reasons.append("PASS_MAX_DAYS 미설정")
        if isinstance(evidence.get("PASS_MIN_DAYS"), int) and evidence["PASS_MIN_DAYS"] < 1:
            vuln_reasons.append("PASS_MIN_DAYS < 1")
    else:
        evidence["login.defs"] = "파일 없음"
        vuln_reasons.append("/etc/login.defs 없음")

    # pwquality.conf
    pwq = read_file_contents("/etc/security/pwquality.conf")
    pwq_ok = False
    if pwq:
        pwq_settings = {}
        for key in ("minlen", "dcredit", "ucredit", "lcredit", "ocredit"):
            m = re.search(rf"^\s*{key}\s*=\s*(-?\d+)", pwq, re.MULTILINE)
            if m:
                pwq_settings[key] = int(m.group(1))
        evidence["pwquality.conf"] = pwq_settings
        if pwq_settings.get("minlen", 0) >= 8:
            credit_keys = ["dcredit", "ucredit", "lcredit", "ocredit"]
            if all(pwq_settings.get(k, 0) <= -1 for k in credit_keys):
                pwq_ok = True
        if not pwq_ok:
            vuln_reasons.append("pwquality.conf 복잡성 미달")
    else:
        evidence["pwquality.conf"] = "파일 없음"

    # PAM 파일 점검 (RHEL: system-auth, Debian: common-password)
    pam_file = "/etc/pam.d/system-auth" if DISTRO == "redhat" else "/etc/pam.d/common-password"
    pam = read_file_contents(pam_file)
    pam_ok = False
    if pam:
        if "pam_pwquality.so" in pam:
            pam_ok = True
            evidence["pam_pwquality"] = "모듈 발견"
    if not pam_ok and not pwq_ok:
        vuln_reasons.append("비밀번호 복잡성 정책 미설정")

    status = "양호" if len(vuln_reasons) == 0 else "취약"
    evidence["vuln_reasons"] = vuln_reasons
    return result_dict(code, name, imp, status, evidence, purpose)


# ──────────────────────────────────────────────
# U-03  계정 잠금 임계값 설정
# ──────────────────────────────────────────────
def check_u03():
    code, name, imp = "U-03", "계정 잠금 임계값 설정", "상"
    purpose = "무차별 대입 공격에 대비하여 계정 잠금 임계값 설정"
    evidence = {}
    found = False

    # faillock.conf
    fl = read_file_contents("/etc/security/faillock.conf")
    if fl:
        m = re.search(r"^\s*deny\s*=\s*(\d+)", fl, re.MULTILINE)
        if m:
            val = int(m.group(1))
            evidence["faillock.conf_deny"] = val
            if 1 <= val <= 10:
                found = True

    # PAM 파일에서 pam_faillock.so 또는 pam_tally2.so deny 값 확인
    pam_files = ["/etc/pam.d/system-auth", "/etc/pam.d/password-auth", "/etc/pam.d/common-auth"]
    for pf in pam_files:
        content = read_file_contents(pf)
        if content:
            for pattern in (r"pam_faillock\.so.*deny=(\d+)", r"pam_tally2?\.so.*deny=(\d+)"):
                m = re.search(pattern, content)
                if m:
                    val = int(m.group(1))
                    evidence[f"{pf}_deny"] = val
                    if 1 <= val <= 10:
                        found = True

    status = "양호" if found else "취약"
    return result_dict(code, name, imp, status, evidence, purpose)


# ──────────────────────────────────────────────
# U-04  비밀번호 파일 보호
# ──────────────────────────────────────────────
def check_u04():
    code, name, imp = "U-04", "비밀번호 파일 보호", "상"
    purpose = "비밀번호가 암호화(shadow)되어 저장되는지 확인"
    evidence = {}

    passwd_content = read_file_contents("/etc/passwd")
    if passwd_content is None:
        return result_dict(code, name, imp, "취약", {"error": "/etc/passwd 읽기 불가"}, purpose)

    non_shadow = []
    for line in passwd_content.splitlines():
        parts = line.strip().split(":")
        if len(parts) >= 2 and parts[1] not in ("x", "*", "!"):
            non_shadow.append(parts[0])

    evidence["non_shadow_accounts"] = non_shadow
    shadow_exists = os.path.isfile("/etc/shadow")
    evidence["shadow_exists"] = shadow_exists

    status = "양호" if (len(non_shadow) == 0 and shadow_exists) else "취약"
    return result_dict(code, name, imp, status, evidence, purpose)


# ──────────────────────────────────────────────
# U-05  root 이외의 UID가 '0' 금지
# ──────────────────────────────────────────────
def check_u05():
    code, name, imp = "U-05", "root 이외의 UID가 '0' 금지", "상"
    purpose = "root 외 UID=0 계정 존재 여부 확인으로 권한 남용 방지"
    evidence = {}

    passwd = read_file_contents("/etc/passwd")
    if passwd is None:
        return result_dict(code, name, imp, "취약", {"error": "/etc/passwd 읽기 불가"}, purpose)

    uid0_accounts = []
    for line in passwd.splitlines():
        parts = line.strip().split(":")
        if len(parts) >= 3 and parts[2] == "0" and parts[0] != "root":
            uid0_accounts.append(parts[0])

    evidence["uid0_non_root"] = uid0_accounts
    status = "양호" if len(uid0_accounts) == 0 else "취약"
    return result_dict(code, name, imp, status, evidence, purpose)


# ──────────────────────────────────────────────
# U-06  사용자 계정 su 기능 제한
# ──────────────────────────────────────────────
def check_u06():
    code, name, imp = "U-06", "사용자 계정 su 기능 제한", "상"
    purpose = "su 명령 사용을 특정 그룹으로 제한하여 권한 상승 차단"
    evidence = {}

    # PAM에서 pam_wheel.so 확인
    pam_su = read_file_contents("/etc/pam.d/su")
    pam_ok = False
    if pam_su:
        for line in pam_su.splitlines():
            stripped = line.strip()
            if stripped.startswith("#"):
                continue
            if "pam_wheel.so" in stripped:
                pam_ok = True
                evidence["pam_wheel"] = stripped
                break
    if not pam_ok:
        evidence["pam_wheel"] = "미설정"

    # /usr/bin/su 권한 확인
    owner, perm = file_owner_and_perm("/usr/bin/su")
    evidence["su_owner"] = owner
    evidence["su_perm"] = perm

    status = "양호" if pam_ok else "취약"
    return result_dict(code, name, imp, status, evidence, purpose)


# ──────────────────────────────────────────────
# U-07  불필요한 계정 제거
# ──────────────────────────────────────────────
def check_u07():
    code, name, imp = "U-07", "불필요한 계정 제거", "하"
    purpose = "불필요한 기본 계정이 존재하는지 점검"
    evidence = {}

    DEFAULT_UNNECESSARY = {"lp", "uucp", "nuucp", "games", "gopher", "nfsnobody"}
    passwd = read_file_contents("/etc/passwd")
    if passwd is None:
        return result_dict(code, name, imp, "수동점검필요", {"error": "/etc/passwd 읽기 불가"}, purpose)

    found = []
    for line in passwd.splitlines():
        parts = line.strip().split(":")
        if len(parts) >= 7:
            user = parts[0]
            shell = parts[6]
            if user in DEFAULT_UNNECESSARY and shell not in ("/bin/false", "/sbin/nologin", "/usr/sbin/nologin"):
                found.append(user)

    evidence["unnecessary_accounts_with_shell"] = found
    # 이것은 기본 점검만 가능 — 퇴직자 등은 수동 확인 필요
    evidence["note"] = "퇴직/전직/휴직 계정은 수동 확인 필요"
    status = "양호" if len(found) == 0 else "취약"
    return result_dict(code, name, imp, status, evidence, purpose)


# ──────────────────────────────────────────────
# U-08  관리자 그룹에 최소한의 계정 포함
# ──────────────────────────────────────────────
def check_u08():
    code, name, imp = "U-08", "관리자 그룹에 최소한의 계정 포함", "중"
    purpose = "root 그룹에 불필요한 계정이 등록되지 않았는지 확인"
    evidence = {}

    group_content = read_file_contents("/etc/group")
    if group_content is None:
        return result_dict(code, name, imp, "수동점검필요", {"error": "/etc/group 읽기 불가"}, purpose)

    for line in group_content.splitlines():
        parts = line.strip().split(":")
        if len(parts) >= 4 and parts[0] == "root":
            members = [m for m in parts[3].split(",") if m]
            evidence["root_group_members"] = members
            break

    # GID=0인 일반 사용자의 기본 그룹도 확인
    passwd = read_file_contents("/etc/passwd")
    gid0_users = []
    if passwd:
        for line in passwd.splitlines():
            p = line.strip().split(":")
            if len(p) >= 4 and p[3] == "0" and p[0] != "root":
                gid0_users.append(p[0])
    evidence["gid0_non_root_users"] = gid0_users

    evidence["note"] = "root 그룹 구성원의 적정성은 수동 확인 필요"
    status = "수동점검필요"
    return result_dict(code, name, imp, status, evidence, purpose)


# ──────────────────────────────────────────────
# U-09  계정이 존재하지 않는 GID 금지
# ──────────────────────────────────────────────
def check_u09():
    code, name, imp = "U-09", "계정이 존재하지 않는 GID 금지", "하"
    purpose = "불필요한 그룹이 존재하는지 점검"
    evidence = {}

    passwd = read_file_contents("/etc/passwd")
    group_f = read_file_contents("/etc/group")
    if not passwd or not group_f:
        return result_dict(code, name, imp, "수동점검필요", {"error": "파일 읽기 불가"}, purpose)

    # passwd에서 사용 중인 GID 수집
    used_gids = set()
    for line in passwd.splitlines():
        p = line.strip().split(":")
        if len(p) >= 4:
            used_gids.add(p[3])

    # group에서 구성원이 없고 GID도 참조되지 않는 그룹
    empty_groups = []
    for line in group_f.splitlines():
        p = line.strip().split(":")
        if len(p) >= 4:
            gname, gid, members = p[0], p[2], p[3]
            if not members.strip() and gid not in used_gids:
                empty_groups.append(f"{gname}(GID={gid})")

    evidence["unused_groups"] = empty_groups
    evidence["note"] = "시스템 그룹은 제외하여 수동 확인 권고"
    status = "수동점검필요"
    return result_dict(code, name, imp, status, evidence, purpose)


# ──────────────────────────────────────────────
# U-10  동일한 UID 금지
# ──────────────────────────────────────────────
def check_u10():
    code, name, imp = "U-10", "동일한 UID 금지", "중"
    purpose = "동일 UID 계정이 존재하지 않도록 하여 감사 추적 보장"
    evidence = {}

    passwd = read_file_contents("/etc/passwd")
    if passwd is None:
        return result_dict(code, name, imp, "취약", {"error": "/etc/passwd 읽기 불가"}, purpose)

    uid_map = {}
    for line in passwd.splitlines():
        p = line.strip().split(":")
        if len(p) >= 3:
            uid_map.setdefault(p[2], []).append(p[0])

    dups = {uid: users for uid, users in uid_map.items() if len(users) > 1}
    evidence["duplicate_uids"] = dups
    status = "양호" if len(dups) == 0 else "취약"
    return result_dict(code, name, imp, status, evidence, purpose)


# ──────────────────────────────────────────────
# U-11  사용자 Shell 점검
# ──────────────────────────────────────────────
def check_u11():
    code, name, imp = "U-11", "사용자 Shell 점검", "하"
    purpose = "로그인 불필요 계정에 /bin/false 또는 /sbin/nologin 쉘 부여 확인"
    evidence = {}

    NO_LOGIN_ACCOUNTS = {
        "daemon", "bin", "sys", "adm", "listen", "nobody", "nobody4",
        "noaccess", "diag", "operator", "games", "gopher"
    }
    NOLOGIN_SHELLS = {"/bin/false", "/sbin/nologin", "/usr/sbin/nologin", "/bin/nologin"}

    passwd = read_file_contents("/etc/passwd")
    if passwd is None:
        return result_dict(code, name, imp, "취약", {"error": "/etc/passwd 읽기 불가"}, purpose)

    bad = []
    for line in passwd.splitlines():
        p = line.strip().split(":")
        if len(p) >= 7:
            user, shell = p[0], p[6]
            if user in NO_LOGIN_ACCOUNTS and shell not in NOLOGIN_SHELLS:
                bad.append(f"{user}({shell})")

    evidence["insecure_shell_accounts"] = bad
    status = "양호" if len(bad) == 0 else "취약"
    return result_dict(code, name, imp, status, evidence, purpose)


# ──────────────────────────────────────────────
# U-12  세션 종료 시간 설정
# ──────────────────────────────────────────────
def check_u12():
    code, name, imp = "U-12", "세션 종료 시간 설정", "하"
    purpose = "유휴 세션 방치로 인한 비인가 접근 방지 (TMOUT ≤ 600)"
    evidence = {}
    found = False

    for fp in ("/etc/profile", "/etc/bashrc", "/etc/bash.bashrc"):
        content = read_file_contents(fp)
        if content:
            m = re.search(r"^\s*(?:export\s+)?TMOUT\s*=\s*(\d+)", content, re.MULTILINE)
            if m:
                val = int(m.group(1))
                evidence[fp] = val
                if val <= 600:
                    found = True

    # csh 계열
    for fp in ("/etc/csh.cshrc", "/etc/csh.login"):
        content = read_file_contents(fp)
        if content:
            m = re.search(r"^\s*set\s+autologout\s*=\s*(\d+)", content, re.MULTILINE)
            if m:
                val = int(m.group(1))
                evidence[fp] = val
                if val <= 10:
                    found = True

    # SSH 설정의 ClientAliveInterval도 체크
    ssh_conf = read_file_contents("/etc/ssh/sshd_config")
    if ssh_conf:
        m = re.search(r"^\s*ClientAliveInterval\s+(\d+)", ssh_conf, re.MULTILINE)
        if m:
            evidence["ClientAliveInterval"] = int(m.group(1))

    status = "양호" if found else "취약"
    return result_dict(code, name, imp, status, evidence, purpose)


# ──────────────────────────────────────────────
# U-13  안전한 비밀번호 암호화 알고리즘 사용
# ──────────────────────────────────────────────
def check_u13():
    code, name, imp = "U-13", "안전한 비밀번호 암호화 알고리즘 사용", "중"
    purpose = "SHA-256($5) 또는 SHA-512($6) 이상의 안전한 해시 사용 여부 확인"
    evidence = {}
    SAFE_PREFIXES = ("$5$", "$6$", "$y$")  # SHA-256, SHA-512, yescrypt

    shadow = read_file_contents("/etc/shadow")
    if shadow is None:
        return result_dict(code, name, imp, "수동점검필요", {"error": "/etc/shadow 읽기 불가(권한 확인)"}, purpose)

    weak_accounts = []
    for line in shadow.splitlines():
        p = line.strip().split(":")
        if len(p) >= 2:
            user, hashval = p[0], p[1]
            if hashval in ("*", "!", "!!", "", "!!*"):
                continue  # 잠금/비활성 계정
            if not any(hashval.startswith(pf) for pf in SAFE_PREFIXES):
                weak_accounts.append(user)

    evidence["weak_hash_accounts"] = weak_accounts

    # login.defs ENCRYPT_METHOD
    defs = read_file_contents("/etc/login.defs")
    if defs:
        m = re.search(r"^\s*ENCRYPT_METHOD\s+(\S+)", defs, re.MULTILINE)
        if m:
            evidence["ENCRYPT_METHOD"] = m.group(1)

    status = "양호" if len(weak_accounts) == 0 else "취약"
    return result_dict(code, name, imp, status, evidence, purpose)


# ──────────────────────────────────────────────
# U-14  root 홈, 패스 디렉터리 권한 및 패스 설정
# ──────────────────────────────────────────────
def check_u14():
    code, name, imp = "U-14", "root 홈, 패스 디렉터리 권한 및 패스 설정", "상"
    purpose = "PATH 환경변수에 '.'이 맨 앞이나 중간에 포함되지 않도록 확인"
    evidence = {}

    path_val = os.environ.get("PATH", "")
    evidence["PATH"] = path_val
    parts = path_val.split(":")

    # "."이 맨 앞이나 중간에 포함되었는지 확인
    vuln = False
    for i, p in enumerate(parts):
        if p in (".", ""):
            if i < len(parts) - 1:  # 마지막이 아닌 위치
                vuln = True
                break

    evidence["dot_in_path_not_last"] = vuln
    status = "취약" if vuln else "양호"
    return result_dict(code, name, imp, status, evidence, purpose)


# ──────────────────────────────────────────────
# U-15  파일 및 디렉터리 소유자 설정
# ──────────────────────────────────────────────
def check_u15():
    code, name, imp = "U-15", "파일 및 디렉터리 소유자 설정", "상"
    purpose = "소유자가 존재하지 않는 파일/디렉터리 존재 여부 확인"
    evidence = {}

    rc, out, _ = run_cmd("find / -nouser -o -nogroup 2>/dev/null | head -20", timeout=30)
    files = [f for f in out.strip().splitlines() if f] if out else []
    evidence["noowner_files_sample"] = files
    evidence["count"] = len(files)

    status = "양호" if len(files) == 0 else "취약"
    return result_dict(code, name, imp, status, evidence, purpose)


# ──────────────────────────────────────────────
# U-16 ~ U-22  파일 소유자 및 권한 점검 (공통 패턴)
# ──────────────────────────────────────────────
def _check_file_owner_perm(code, name, imp, filepath, expected_owner, max_perm, purpose,
                           additional_owners=None):
    """파일 소유자 및 권한 공통 점검 함수."""
    evidence = {}
    owner, perm = file_owner_and_perm(filepath)
    if owner is None:
        evidence[filepath] = "파일 없음"
        return result_dict(code, name, imp, "N/A", evidence, purpose)

    evidence["owner"] = owner
    evidence["perm"] = perm
    allowed_owners = {"root"}
    if additional_owners:
        allowed_owners.update(additional_owners)

    owner_ok = owner in allowed_owners
    perm_ok = perm_le(perm, max_perm)
    evidence["owner_ok"] = owner_ok
    evidence["perm_ok"] = perm_ok
    status = "양호" if (owner_ok and perm_ok) else "취약"
    return result_dict(code, name, imp, status, evidence, purpose)


def check_u16():
    return _check_file_owner_perm(
        "U-16", "/etc/passwd 파일 소유자 및 권한 설정", "상",
        "/etc/passwd", "root", "0o644",
        "/etc/passwd 파일을 관리자만 제어하여 비인가자의 변조 방지"
    )

def check_u17():
    code, name, imp = "U-17", "시스템 시작 스크립트 권한 설정", "상"
    purpose = "시스템 시작 스크립트 소유자가 root이고 일반 사용자 쓰기 권한 제거 확인"
    evidence = {}
    vuln_files = []

    dirs_to_check = []
    # systemd
    if os.path.isdir("/etc/systemd/system"):
        dirs_to_check.append("/etc/systemd/system")
    # init
    for d in ("/etc/rc.d", "/etc/init.d"):
        if os.path.isdir(d):
            dirs_to_check.append(d)

    for d in dirs_to_check:
        rc, out, _ = run_cmd(f"find {d} -type f -perm -o+w 2>/dev/null | head -10")
        if out:
            vuln_files.extend(out.splitlines())

    evidence["world_writable_startup_scripts"] = vuln_files[:20]
    status = "양호" if len(vuln_files) == 0 else "취약"
    return result_dict(code, name, imp, status, evidence, purpose)


def check_u18():
    return _check_file_owner_perm(
        "U-18", "/etc/shadow 파일 소유자 및 권한 설정", "상",
        "/etc/shadow", "root", "0o400",
        "/etc/shadow 파일을 관리자만 제어하여 비인가자의 변조 방지"
    )

def check_u19():
    return _check_file_owner_perm(
        "U-19", "/etc/hosts 파일 소유자 및 권한 설정", "상",
        "/etc/hosts", "root", "0o644",
        "/etc/hosts 파일을 관리자만 제어하여 비인가자의 변조 방지"
    )

def check_u20():
    code, name, imp = "U-20", "/etc/(x)inetd.conf 파일 소유자 및 권한 설정", "상"
    purpose = "/etc/(x)inetd.conf 또는 /etc/systemd/system.conf 소유자 및 권한 확인"
    evidence = {}
    targets = ["/etc/inetd.conf", "/etc/xinetd.conf", "/etc/systemd/system.conf"]
    all_ok = True
    any_exist = False

    for fp in targets:
        owner, perm = file_owner_and_perm(fp)
        if owner is not None:
            any_exist = True
            ok = (owner == "root") and perm_le(perm, "0o600")
            evidence[fp] = {"owner": owner, "perm": perm, "ok": ok}
            if not ok:
                all_ok = False

    if not any_exist:
        return result_dict(code, name, imp, "N/A", {"note": "해당 파일 없음"}, purpose)
    status = "양호" if all_ok else "취약"
    return result_dict(code, name, imp, status, evidence, purpose)


def check_u21():
    code, name, imp = "U-21", "/etc/(r)syslog.conf 파일 소유자 및 권한 설정", "상"
    purpose = "/etc/rsyslog.conf 또는 /etc/syslog.conf 소유자 및 권한 확인"
    for fp in ("/etc/rsyslog.conf", "/etc/syslog.conf"):
        owner, perm = file_owner_and_perm(fp)
        if owner is not None:
            return _check_file_owner_perm(
                code, name, imp, fp, "root", "0o640", purpose,
                additional_owners={"bin", "sys"}
            )
    return result_dict(code, name, imp, "N/A", {"note": "syslog.conf 파일 없음"}, purpose)


def check_u22():
    return _check_file_owner_perm(
        "U-22", "/etc/services 파일 소유자 및 권한 설정", "상",
        "/etc/services", "root", "0o644",
        "/etc/services 파일을 관리자만 제어하여 비인가자의 변조 방지",
        additional_owners={"bin", "sys"}
    )


# ──────────────────────────────────────────────
# U-23  SUID, SGID, Sticky bit 설정 파일 점검
# ──────────────────────────────────────────────
def check_u23():
    code, name, imp = "U-23", "SUID, SGID, Sticky bit 설정 파일 점검", "상"
    purpose = "불필요한 SUID/SGID 설정 파일을 확인하여 권한 상승 방지"
    evidence = {}

    # 주요 위험 SUID 파일 목록
    KNOWN_DANGEROUS = {
        "/usr/bin/newgrp", "/usr/bin/chage", "/usr/bin/gpasswd",
        "/sbin/unix_chkpwd", "/usr/sbin/unix_chkpwd",
    }

    rc, out, _ = run_cmd(
        "find / -user root -type f \\( -perm -04000 -o -perm -02000 \\) -xdev 2>/dev/null | head -50",
        timeout=30
    )
    suid_files = out.strip().splitlines() if out else []
    evidence["suid_sgid_files"] = suid_files
    evidence["count"] = len(suid_files)
    evidence["note"] = "SUID/SGID 파일 목록의 적정성은 수동 확인 필요"
    status = "수동점검필요"
    return result_dict(code, name, imp, status, evidence, purpose)


# ──────────────────────────────────────────────
# U-24  사용자, 시스템 환경변수 파일 소유자 및 권한 설정
# ──────────────────────────────────────────────
def check_u24():
    code, name, imp = "U-24", "사용자, 시스템 환경변수 파일 소유자 및 권한 설정", "상"
    purpose = "홈 디렉터리 환경변수 파일에 타 사용자 쓰기 권한이 없는지 확인"
    evidence = {}
    vuln = []

    ENV_FILES = [".profile", ".kshrc", ".cshrc", ".bashrc", ".bash_profile", ".login", ".exrc", ".netrc"]
    passwd = read_file_contents("/etc/passwd")
    if not passwd:
        return result_dict(code, name, imp, "수동점검필요", {"error": "/etc/passwd 읽기 불가"}, purpose)

    for line in passwd.splitlines():
        p = line.strip().split(":")
        if len(p) >= 6:
            user, home = p[0], p[5]
            if not home or home == "/" or not os.path.isdir(home):
                continue
            for ef in ENV_FILES:
                fp = os.path.join(home, ef)
                st = file_stat(fp)
                if st is None:
                    continue
                mode = stat.S_IMODE(st.st_mode)
                if mode & stat.S_IWOTH:  # other write
                    vuln.append(fp)

    evidence["world_writable_env_files"] = vuln[:30]
    status = "양호" if len(vuln) == 0 else "취약"
    return result_dict(code, name, imp, status, evidence, purpose)


# ──────────────────────────────────────────────
# U-25  world writable 파일 점검
# ──────────────────────────────────────────────
def check_u25():
    code, name, imp = "U-25", "world writable 파일 점검", "상"
    purpose = "모든 사용자에게 쓰기 권한이 부여된 파일 존재 여부 확인"
    evidence = {}

    rc, out, _ = run_cmd(
        "find / -xdev -type f -perm -0002 ! -path '/proc/*' ! -path '/sys/*' 2>/dev/null | head -30",
        timeout=30
    )
    files = out.strip().splitlines() if out else []
    evidence["world_writable_files"] = files
    evidence["count"] = len(files)
    status = "양호" if len(files) == 0 else "취약"
    return result_dict(code, name, imp, status, evidence, purpose)


# ──────────────────────────────────────────────
# U-26  /dev에 존재하지 않는 device 파일 점검
# ──────────────────────────────────────────────
def check_u26():
    code, name, imp = "U-26", "/dev에 존재하지 않는 device 파일 점검", "상"
    purpose = "/dev 디렉터리에 major/minor 번호가 없는 일반 파일 존재 여부 확인"
    evidence = {}

    rc, out, _ = run_cmd("find /dev -type f 2>/dev/null", timeout=15)
    files = out.strip().splitlines() if out else []
    # mqueue, shm 등 예외
    suspicious = [f for f in files if "/mqueue" not in f and "/shm" not in f]
    evidence["non_device_files_in_dev"] = suspicious
    status = "양호" if len(suspicious) == 0 else "취약"
    return result_dict(code, name, imp, status, evidence, purpose)


# ──────────────────────────────────────────────
# U-27  $HOME/.rhosts, hosts.equiv 사용 금지
# ──────────────────────────────────────────────
def check_u27():
    code, name, imp = "U-27", "$HOME/.rhosts, hosts.equiv 사용 금지", "상"
    purpose = "r-command를 통한 인증 없는 원격 접속 차단"
    evidence = {}
    vuln = False

    # /etc/hosts.equiv
    he = read_file_contents("/etc/hosts.equiv")
    if he is not None:
        evidence["hosts.equiv_exists"] = True
        if "+" in he:
            evidence["hosts.equiv_plus"] = True
            vuln = True
        owner, perm = file_owner_and_perm("/etc/hosts.equiv")
        evidence["hosts.equiv_owner"] = owner
        evidence["hosts.equiv_perm"] = perm
        if owner != "root" or (perm and not perm_le(perm, "0o600")):
            vuln = True
    else:
        evidence["hosts.equiv_exists"] = False

    # 각 사용자의 .rhosts
    rhosts_found = []
    passwd = read_file_contents("/etc/passwd")
    if passwd:
        for line in passwd.splitlines():
            p = line.strip().split(":")
            if len(p) >= 6:
                home = p[5]
                rh = os.path.join(home, ".rhosts")
                if os.path.isfile(rh):
                    content = read_file_contents(rh)
                    if content and "+" in content:
                        rhosts_found.append(rh)
                        vuln = True

    evidence["rhosts_with_plus"] = rhosts_found

    # r 서비스 미사용 시 양호 처리 가능
    r_running = process_running("rlogind|rshd|rexecd")
    evidence["r_services_running"] = r_running
    if not r_running and not vuln:
        status = "양호"
    else:
        status = "취약" if vuln else "양호"
    return result_dict(code, name, imp, status, evidence, purpose)


# ──────────────────────────────────────────────
# U-28  접속 IP 및 포트 제한
# ──────────────────────────────────────────────
def check_u28():
    code, name, imp = "U-28", "접속 IP 및 포트 제한", "상"
    purpose = "방화벽 또는 TCP Wrapper를 사용하여 접속 IP/포트 제한 설정 확인"
    evidence = {}
    found = False

    # TCP Wrapper
    hosts_deny = read_file_contents("/etc/hosts.deny")
    hosts_allow = read_file_contents("/etc/hosts.allow")
    if hosts_deny:
        if re.search(r"^\s*ALL\s*:\s*ALL", hosts_deny, re.MULTILINE):
            evidence["hosts.deny_ALL:ALL"] = True
            found = True
    if hosts_allow:
        evidence["hosts.allow_exists"] = True

    # iptables
    rc, out, _ = run_cmd("iptables -L -n 2>/dev/null | head -30")
    if rc == 0 and out:
        evidence["iptables_rules_sample"] = out[:500]
        if "ACCEPT" in out or "DROP" in out or "REJECT" in out:
            found = True

    # firewalld
    rc, out, _ = run_cmd("firewall-cmd --list-all 2>/dev/null")
    if rc == 0 and out:
        evidence["firewalld_config"] = out[:500]
        found = True

    # ufw
    rc, out, _ = run_cmd("ufw status 2>/dev/null")
    if rc == 0 and "active" in out.lower():
        evidence["ufw_status"] = out[:500]
        found = True

    # nftables
    rc, out, _ = run_cmd("nft list ruleset 2>/dev/null | head -20")
    if rc == 0 and out.strip():
        evidence["nftables"] = out[:500]
        found = True

    status = "양호" if found else "취약"
    return result_dict(code, name, imp, status, evidence, purpose)


# ──────────────────────────────────────────────
# U-29  hosts.lpd 파일 소유자 및 권한 설정
# ──────────────────────────────────────────────
def check_u29():
    code, name, imp = "U-29", "hosts.lpd 파일 소유자 및 권한 설정", "하"
    purpose = "/etc/hosts.lpd 파일 제거 또는 소유자·권한 적정성 확인"
    fp = "/etc/hosts.lpd"
    if not os.path.isfile(fp):
        return result_dict(code, name, imp, "양호", {"exists": False}, purpose)
    return _check_file_owner_perm(code, name, imp, fp, "root", "0o600", purpose)


# ──────────────────────────────────────────────
# U-30  UMASK 설정 관리
# ──────────────────────────────────────────────
def check_u30():
    code, name, imp = "U-30", "UMASK 설정 관리", "중"
    purpose = "UMASK 값이 022 이상으로 설정되어 신규 파일에 과도한 권한을 방지"
    evidence = {}
    found_ok = False

    for fp in ("/etc/profile", "/etc/login.defs", "/etc/bashrc", "/etc/bash.bashrc"):
        content = read_file_contents(fp)
        if content:
            matches = re.findall(r"(?:^|\s)(?:UMASK|umask)\s+(\d{3,4})", content, re.MULTILINE | re.IGNORECASE)
            if matches:
                evidence[fp] = matches
                for m in matches:
                    val = int(m, 8)
                    if val >= 0o022:
                        found_ok = True

    # 현재 umask 확인
    rc, out, _ = run_cmd("umask")
    if rc == 0:
        evidence["current_umask"] = out.strip()
        try:
            if int(out.strip(), 8) >= 0o022:
                found_ok = True
        except ValueError:
            pass

    status = "양호" if found_ok else "취약"
    return result_dict(code, name, imp, status, evidence, purpose)


# ──────────────────────────────────────────────
# U-31  홈 디렉토리 소유자 및 권한 설정
# ──────────────────────────────────────────────
def check_u31():
    code, name, imp = "U-31", "홈 디렉토리 소유자 및 권한 설정", "중"
    purpose = "홈 디렉토리 소유자가 해당 계정이고 타 사용자 쓰기 권한 제거 확인"
    evidence = {}
    vuln = []

    passwd = read_file_contents("/etc/passwd")
    if not passwd:
        return result_dict(code, name, imp, "수동점검필요", {"error": "/etc/passwd 읽기 불가"}, purpose)

    for line in passwd.splitlines():
        p = line.strip().split(":")
        if len(p) >= 7:
            user, home, shell = p[0], p[5], p[6]
            if shell in ("/bin/false", "/sbin/nologin", "/usr/sbin/nologin"):
                continue
            if not home or home == "/" or not os.path.isdir(home):
                continue
            st = file_stat(home)
            if st is None:
                continue
            try:
                dir_owner = pwd.getpwuid(st.st_uid).pw_name
            except KeyError:
                dir_owner = str(st.st_uid)
            mode = stat.S_IMODE(st.st_mode)
            if dir_owner != user or (mode & stat.S_IWOTH):
                vuln.append({"user": user, "home": home, "owner": dir_owner, "perm": oct(mode)})

    evidence["vulnerable_homedirs"] = vuln[:20]
    status = "양호" if len(vuln) == 0 else "취약"
    return result_dict(code, name, imp, status, evidence, purpose)


# ──────────────────────────────────────────────
# U-32  홈 디렉토리로 지정한 디렉토리의 존재 관리
# ──────────────────────────────────────────────
def check_u32():
    code, name, imp = "U-32", "홈 디렉토리로 지정한 디렉토리의 존재 관리", "중"
    purpose = "/etc/passwd에 설정된 홈 디렉토리가 실제 존재하는지 확인"
    evidence = {}
    missing = []

    passwd = read_file_contents("/etc/passwd")
    if not passwd:
        return result_dict(code, name, imp, "수동점검필요", {"error": "/etc/passwd 읽기 불가"}, purpose)

    for line in passwd.splitlines():
        p = line.strip().split(":")
        if len(p) >= 7:
            user, home, shell = p[0], p[5], p[6]
            if shell in ("/bin/false", "/sbin/nologin", "/usr/sbin/nologin"):
                continue
            if home and home != "/" and not os.path.isdir(home):
                missing.append(f"{user}:{home}")

    evidence["missing_homedirs"] = missing
    status = "양호" if len(missing) == 0 else "취약"
    return result_dict(code, name, imp, status, evidence, purpose)


# ──────────────────────────────────────────────
# U-33  숨겨진 파일 및 디렉토리 검색 및 제거
# ──────────────────────────────────────────────
def check_u33():
    code, name, imp = "U-33", "숨겨진 파일 및 디렉토리 검색 및 제거", "하"
    purpose = "숨겨진 파일·디렉터리 중 의심스러운 파일 존재 여부 확인"
    evidence = {}
    evidence["note"] = "숨겨진 파일 목록은 수동 확인 필요"

    # / 및 /tmp에서 숨김 파일 샘플 확인
    rc, out, _ = run_cmd("find /tmp /var/tmp -name '.*' -type f 2>/dev/null | head -20", timeout=15)
    evidence["hidden_files_in_tmp"] = out.strip().splitlines() if out else []

    status = "수동점검필요"
    return result_dict(code, name, imp, status, evidence, purpose)


# ──────────────────────────────────────────────
# U-34  Finger 서비스 비활성화
# ──────────────────────────────────────────────
def check_u34():
    code, name, imp = "U-34", "Finger 서비스 비활성화", "상"
    purpose = "Finger 서비스를 통한 사용자 정보 노출 방지"
    evidence = {}

    active = (
        is_service_active("finger") or
        is_service_active("finger.socket") or
        process_running("fingerd|in\\.fingerd")
    )
    # xinetd 방식 확인
    xinetd_finger = read_file_contents("/etc/xinetd.d/finger")
    if xinetd_finger and "disable" in xinetd_finger:
        m = re.search(r"disable\s*=\s*(\S+)", xinetd_finger, re.IGNORECASE)
        if m and m.group(1).lower() == "no":
            active = True
            evidence["xinetd_finger"] = "enabled"

    evidence["finger_active"] = active
    status = "양호" if not active else "취약"
    return result_dict(code, name, imp, status, evidence, purpose)


# ──────────────────────────────────────────────
# U-35  공유 서비스에 대한 익명 접근 제한 설정
# ──────────────────────────────────────────────
def check_u35():
    code, name, imp = "U-35", "공유 서비스에 대한 익명 접근 제한 설정", "상"
    purpose = "FTP/NFS/Samba 등 공유 서비스의 익명 접근 제한 확인"
    evidence = {}
    vuln = False

    # vsFTPd anonymous
    for fp in ("/etc/vsftpd.conf", "/etc/vsftpd/vsftpd.conf"):
        content = read_file_contents(fp)
        if content:
            m = re.search(r"^\s*anonymous_enable\s*=\s*(\S+)", content, re.MULTILINE | re.IGNORECASE)
            if m:
                val = m.group(1).upper()
                evidence["vsftpd_anonymous_enable"] = val
                if val == "YES":
                    vuln = True

    # NFS exports에 everyone 공유
    exports = read_file_contents("/etc/exports")
    if exports:
        for line in exports.splitlines():
            stripped = line.strip()
            if stripped and not stripped.startswith("#"):
                # *(rw ...) 패턴은 모든 호스트 접근 허용
                if re.search(r"\*\s*\(", stripped):
                    evidence["nfs_wildcard"] = stripped
                    vuln = True

    # Samba guest ok
    smb = read_file_contents("/etc/samba/smb.conf")
    if smb:
        if re.search(r"^\s*guest\s+ok\s*=\s*yes", smb, re.MULTILINE | re.IGNORECASE):
            evidence["samba_guest_ok"] = "yes"
            vuln = True

    # 서비스가 모두 미사용이면 양호
    ftp_running = service_running_any(["vsftpd", "proftpd", "pure-ftpd"])
    nfs_running = service_running_any(["nfs-server", "nfs"])
    smb_running = service_running_any(["smbd", "smb"])
    evidence["services_running"] = {"ftp": ftp_running, "nfs": nfs_running, "samba": smb_running}

    if not ftp_running and not nfs_running and not smb_running:
        status = "양호"
    else:
        status = "취약" if vuln else "양호"
    return result_dict(code, name, imp, status, evidence, purpose)


# ──────────────────────────────────────────────
# U-36  r 계열 서비스 비활성화
# ──────────────────────────────────────────────
def check_u36():
    code, name, imp = "U-36", "r 계열 서비스 비활성화", "상"
    purpose = "rlogin, rsh, rexec 등 r-command 서비스 비활성화 확인"
    evidence = {}

    r_services = ["rlogin", "rsh", "rexec", "rlogin.socket", "rsh.socket", "rexec.socket"]
    active = []
    for s in r_services:
        if is_service_active(s) or is_service_enabled(s):
            active.append(s)

    proc_active = process_running("rlogind|rshd|rexecd")
    evidence["active_services"] = active
    evidence["process_running"] = proc_active

    status = "양호" if (len(active) == 0 and not proc_active) else "취약"
    return result_dict(code, name, imp, status, evidence, purpose)


# ──────────────────────────────────────────────
# U-37  crontab 설정파일 권한 설정
# ──────────────────────────────────────────────
def check_u37():
    code, name, imp = "U-37", "crontab 설정파일 권한 설정 미흡", "상"
    purpose = "crontab 및 at 관련 파일의 소유자·권한 확인"
    evidence = {}
    vuln = []

    # crontab 명령어 권한
    for fp in ("/usr/bin/crontab", "/usr/bin/at"):
        owner, perm = file_owner_and_perm(fp)
        if owner is not None:
            evidence[fp] = {"owner": owner, "perm": perm}
            if perm and not perm_le(perm, "0o4750"):
                vuln.append(fp)

    # cron 관련 설정 파일
    cron_files = [
        "/etc/cron.allow", "/etc/cron.deny", "/etc/at.allow", "/etc/at.deny",
        "/etc/crontab"
    ]
    for fp in cron_files:
        owner, perm = file_owner_and_perm(fp)
        if owner is not None:
            ok = (owner == "root") and perm_le(perm, "0o640")
            evidence[fp] = {"owner": owner, "perm": perm, "ok": ok}
            if not ok:
                vuln.append(fp)

    # cron 디렉터리
    for d in ("/etc/cron.d", "/etc/cron.daily", "/etc/cron.hourly", "/etc/cron.weekly", "/etc/cron.monthly"):
        if os.path.isdir(d):
            rc, out, _ = run_cmd(f"find {d} -type f ! -user root -o -type f -perm -o+w 2>/dev/null | head -5")
            if out:
                vuln.extend(out.strip().splitlines())

    evidence["vulnerable_files"] = vuln
    status = "양호" if len(vuln) == 0 else "취약"
    return result_dict(code, name, imp, status, evidence, purpose)


# ──────────────────────────────────────────────
# U-38  DoS 공격에 취약한 서비스 비활성화
# ──────────────────────────────────────────────
def check_u38():
    code, name, imp = "U-38", "DoS 공격에 취약한 서비스 비활성화", "상"
    purpose = "echo, discard, daytime, chargen 등 서비스 비활성화 확인"
    evidence = {}

    dos_services = ["echo", "discard", "daytime", "chargen",
                    "echo-stream", "echo-dgram", "discard-stream", "discard-dgram",
                    "daytime-stream", "daytime-dgram", "chargen-stream", "chargen-dgram"]
    active = []
    for s in dos_services:
        if is_service_active(s) or is_service_active(f"{s}.socket"):
            active.append(s)

    # xinetd 확인
    for svc in ("echo", "discard", "daytime", "chargen"):
        xf = read_file_contents(f"/etc/xinetd.d/{svc}")
        if xf:
            m = re.search(r"disable\s*=\s*(\S+)", xf, re.IGNORECASE)
            if m and m.group(1).lower() == "no":
                active.append(f"xinetd:{svc}")

    evidence["active_dos_services"] = active
    status = "양호" if len(active) == 0 else "취약"
    return result_dict(code, name, imp, status, evidence, purpose)


# ──────────────────────────────────────────────
# U-39  불필요한 NFS 서비스 비활성화
# ──────────────────────────────────────────────
def check_u39():
    code, name, imp = "U-39", "불필요한 NFS 서비스 비활성화", "상"
    purpose = "불필요한 NFS 서비스 데몬 비활성화 확인"
    evidence = {}

    nfs_active = service_running_any(["nfs-server", "nfs", "nfs-kernel-server"])
    nfs_proc = process_running("nfsd|rpc\\.statd|rpc\\.lockd")
    evidence["nfs_service_active"] = nfs_active
    evidence["nfs_process_running"] = nfs_proc

    # exports 파일로 실 사용 여부 확인
    exports = read_file_contents("/etc/exports")
    has_shares = False
    if exports:
        for line in exports.splitlines():
            if line.strip() and not line.strip().startswith("#"):
                has_shares = True
                break
    evidence["has_nfs_shares"] = has_shares

    if nfs_active or nfs_proc:
        status = "수동점검필요"
        evidence["note"] = "NFS 서비스가 사용 중이며 필요성 검토 필요"
    else:
        status = "양호"
    return result_dict(code, name, imp, status, evidence, purpose)


# ──────────────────────────────────────────────
# U-40  NFS 접근 통제
# ──────────────────────────────────────────────
def check_u40():
    code, name, imp = "U-40", "NFS 접근 통제", "상"
    purpose = "NFS 설정 파일에 접근 통제가 설정되어 있는지 확인"
    evidence = {}

    exports_path = "/etc/exports"
    if not os.path.isfile(exports_path):
        return result_dict(code, name, imp, "N/A", {"note": "NFS 미사용(/etc/exports 없음)"}, purpose)

    owner, perm = file_owner_and_perm(exports_path)
    evidence["owner"] = owner
    evidence["perm"] = perm

    content = read_file_contents(exports_path)
    vuln = False
    if content:
        for line in content.splitlines():
            stripped = line.strip()
            if stripped and not stripped.startswith("#"):
                # 모든 호스트 허용 패턴 (예: /share *(rw))
                if re.search(r"\s+\*\(", stripped) or re.search(r"\s+\*\s", stripped):
                    evidence["wildcard_export"] = stripped
                    vuln = True

    if perm and not perm_le(perm, "0o644"):
        vuln = True

    status = "취약" if vuln else "양호"
    return result_dict(code, name, imp, status, evidence, purpose)


# ──────────────────────────────────────────────
# U-41  불필요한 automountd 제거
# ──────────────────────────────────────────────
def check_u41():
    code, name, imp = "U-41", "불필요한 automountd 제거", "상"
    purpose = "automountd/autofs 서비스 비활성화 확인"
    evidence = {}

    active = service_running_any(["autofs", "automount"]) or process_running("automountd|autofs")
    evidence["automountd_active"] = active
    status = "양호" if not active else "취약"
    return result_dict(code, name, imp, status, evidence, purpose)


# ──────────────────────────────────────────────
# U-42  불필요한 RPC 서비스 비활성화
# ──────────────────────────────────────────────
def check_u42():
    code, name, imp = "U-42", "불필요한 RPC 서비스 비활성화", "상"
    purpose = "취약점이 많은 RPC 서비스(rpc.cmsd, rstatd 등) 비활성화 확인"
    evidence = {}

    DANGEROUS_RPC = [
        "rpc.cmsd", "rpc.ttdbserverd", "sadmind", "rusersd", "walld",
        "sprayd", "rstatd", "rpc.nisd", "rexd", "rpc.pcnfsd",
        "rpc.statd", "rpc.ypupdated", "rpc.rquotad", "kcms_server", "cachefsd"
    ]
    pattern = "|".join(DANGEROUS_RPC)
    active = process_running(pattern)
    evidence["dangerous_rpc_running"] = active

    rc, out, _ = run_cmd(f"ps -ef 2>/dev/null | grep -E '{pattern}' | grep -v grep")
    evidence["processes"] = out.strip() if out else ""

    status = "양호" if not active else "취약"
    return result_dict(code, name, imp, status, evidence, purpose)


# ──────────────────────────────────────────────
# U-43  NIS, NIS+ 점검
# ──────────────────────────────────────────────
def check_u43():
    code, name, imp = "U-43", "NIS, NIS+ 점검", "상"
    purpose = "NIS 서비스 비활성화 확인"
    evidence = {}

    nis_services = ["ypserv", "ypbind", "ypxfrd", "rpc.yppasswdd", "rpc.ypupdated"]
    active = []
    for s in nis_services:
        if is_service_active(s) or process_running(s):
            active.append(s)

    evidence["active_nis_services"] = active
    status = "양호" if len(active) == 0 else "취약"
    return result_dict(code, name, imp, status, evidence, purpose)


# ──────────────────────────────────────────────
# U-44  tftp, talk 서비스 비활성화
# ──────────────────────────────────────────────
def check_u44():
    code, name, imp = "U-44", "tftp, talk 서비스 비활성화", "상"
    purpose = "tftp, talk, ntalk 서비스 비활성화 확인"
    evidence = {}

    services = ["tftp", "tftp.socket", "talk", "ntalk", "tftpd"]
    active = []
    for s in services:
        if is_service_active(s) or is_service_enabled(s):
            active.append(s)

    proc = process_running("tftpd|talkd|in\\.tftpd|in\\.talkd")
    evidence["active_services"] = active
    evidence["process_running"] = proc
    status = "양호" if (len(active) == 0 and not proc) else "취약"
    return result_dict(code, name, imp, status, evidence, purpose)


# ──────────────────────────────────────────────
# U-45  메일 서비스 버전 점검
# ──────────────────────────────────────────────
def check_u45():
    code, name, imp = "U-45", "메일 서비스 버전 점검", "상"
    purpose = "메일 서비스(Sendmail/Postfix/Exim) 버전이 최신인지 확인"
    evidence = {}

    # Sendmail
    rc, out, _ = run_cmd("sendmail -d0.1 -bt < /dev/null 2>&1 | grep -i version | head -1")
    if rc == 0 and out:
        evidence["sendmail_version"] = out.strip()

    # Postfix
    rc, out, _ = run_cmd("postconf mail_version 2>/dev/null")
    if rc == 0 and out:
        evidence["postfix_version"] = out.strip()

    # Exim
    rc, out, _ = run_cmd("exim -bV 2>/dev/null | head -1")
    if rc == 0 and out:
        evidence["exim_version"] = out.strip()

    if not evidence:
        return result_dict(code, name, imp, "N/A", {"note": "메일 서비스 미설치"}, purpose)

    evidence["note"] = "최신 버전 여부는 벤더 패치 목록과 대조하여 수동 확인 필요"
    status = "수동점검필요"
    return result_dict(code, name, imp, status, evidence, purpose)


# ──────────────────────────────────────────────
# U-46  일반 사용자의 메일 서비스 실행 방지
# ──────────────────────────────────────────────
def check_u46():
    code, name, imp = "U-46", "일반 사용자의 메일 서비스 실행 방지", "상"
    purpose = "SMTP 서비스의 -q 옵션 제한 설정 확인"
    evidence = {}

    # Sendmail PrivacyOptions에 restrictqrun 포함 여부
    for fp in ("/etc/mail/sendmail.cf", "/etc/sendmail.cf"):
        content = read_file_contents(fp)
        if content:
            m = re.search(r"^\s*O\s+PrivacyOptions\s*=\s*(.+)", content, re.MULTILINE)
            if m:
                val = m.group(1)
                evidence["PrivacyOptions"] = val
                if "restrictqrun" in val.lower():
                    return result_dict(code, name, imp, "양호", evidence, purpose)
                else:
                    return result_dict(code, name, imp, "취약", evidence, purpose)

    # sendmail 미사용
    if not process_running("sendmail"):
        return result_dict(code, name, imp, "N/A", {"note": "Sendmail 미사용"}, purpose)

    evidence["note"] = "sendmail.cf 내 PrivacyOptions 확인 불가"
    return result_dict(code, name, imp, "수동점검필요", evidence, purpose)


# ──────────────────────────────────────────────
# U-47  스팸 메일 릴레이 제한
# ──────────────────────────────────────────────
def check_u47():
    code, name, imp = "U-47", "스팸 메일 릴레이 제한", "상"
    purpose = "메일 서비스의 릴레이 기능 제한 확인"
    evidence = {}

    # Sendmail
    for fp in ("/etc/mail/sendmail.cf", "/etc/sendmail.cf"):
        content = read_file_contents(fp)
        if content:
            if re.search(r"R\$\*\s+\$#error", content):
                evidence["relay_reject_rule"] = True
                return result_dict(code, name, imp, "양호", evidence, purpose)

    # Postfix
    main_cf = read_file_contents("/etc/postfix/main.cf")
    if main_cf:
        m = re.search(r"^\s*smtpd_relay_restrictions\s*=\s*(.+)", main_cf, re.MULTILINE)
        if m:
            evidence["smtpd_relay_restrictions"] = m.group(1)
            if "reject_unauth_destination" in m.group(1):
                return result_dict(code, name, imp, "양호", evidence, purpose)

    if not process_running("sendmail|postfix|master"):
        return result_dict(code, name, imp, "N/A", {"note": "메일 서비스 미사용"}, purpose)

    return result_dict(code, name, imp, "수동점검필요", evidence, purpose)


# ──────────────────────────────────────────────
# U-48  expn, vrfy 명령어 제한
# ──────────────────────────────────────────────
def check_u48():
    code, name, imp = "U-48", "expn, vrfy 명령어 제한", "중"
    purpose = "SMTP 서비스에서 expn, vrfy 명령어 제한 여부 확인"
    evidence = {}

    for fp in ("/etc/mail/sendmail.cf", "/etc/sendmail.cf"):
        content = read_file_contents(fp)
        if content:
            m = re.search(r"^\s*O\s+PrivacyOptions\s*=\s*(.+)", content, re.MULTILINE)
            if m:
                val = m.group(1).lower()
                evidence["PrivacyOptions"] = m.group(1)
                ok = "noexpn" in val and "novrfy" in val
                return result_dict(code, name, imp, "양호" if ok else "취약", evidence, purpose)

    # Postfix는 기본적으로 vrfy/expn 비활성
    main_cf = read_file_contents("/etc/postfix/main.cf")
    if main_cf:
        m = re.search(r"^\s*disable_vrfy_command\s*=\s*(\S+)", main_cf, re.MULTILINE)
        if m:
            evidence["disable_vrfy_command"] = m.group(1)
            return result_dict(code, name, imp, "양호" if m.group(1).lower() == "yes" else "취약", evidence, purpose)

    if not process_running("sendmail|postfix|master"):
        return result_dict(code, name, imp, "N/A", {"note": "메일 서비스 미사용"}, purpose)
    return result_dict(code, name, imp, "수동점검필요", evidence, purpose)


# ──────────────────────────────────────────────
# U-49  DNS 보안 버전 패치
# ──────────────────────────────────────────────
def check_u49():
    code, name, imp = "U-49", "DNS 보안 버전 패치", "상"
    purpose = "BIND 등 DNS 서비스의 최신 버전 사용 여부 확인"
    evidence = {}

    rc, out, _ = run_cmd("named -v 2>/dev/null")
    if rc == 0 and out:
        evidence["named_version"] = out.strip()
        evidence["note"] = "최신 패치 여부는 ISC 공지와 대조하여 수동 확인 필요"
        return result_dict(code, name, imp, "수동점검필요", evidence, purpose)

    if not process_running("named"):
        return result_dict(code, name, imp, "N/A", {"note": "DNS 서비스 미사용"}, purpose)
    return result_dict(code, name, imp, "수동점검필요", evidence, purpose)


# ──────────────────────────────────────────────
# U-50  DNS Zone Transfer 설정
# ──────────────────────────────────────────────
def check_u50():
    code, name, imp = "U-50", "DNS Zone Transfer 설정", "상"
    purpose = "DNS Zone Transfer를 허가된 서버로만 제한하는지 확인"
    evidence = {}

    named_conf = None
    for fp in ("/etc/named.conf", "/etc/bind/named.conf", "/etc/bind/named.conf.options"):
        content = read_file_contents(fp)
        if content:
            named_conf = content
            evidence["config_file"] = fp
            break

    if named_conf is None:
        if not process_running("named"):
            return result_dict(code, name, imp, "N/A", {"note": "DNS 서비스 미사용"}, purpose)
        return result_dict(code, name, imp, "수동점검필요", {"error": "named.conf 없음"}, purpose)

    # allow-transfer 확인
    m = re.search(r"allow-transfer\s*\{([^}]+)\}", named_conf)
    if m:
        val = m.group(1).strip()
        evidence["allow-transfer"] = val
        if val in ("none;", "none ;"):
            status = "양호"
        elif "any" in val:
            status = "취약"
        else:
            status = "양호"  # 특정 IP로 제한됨
    else:
        evidence["allow-transfer"] = "미설정(기본값: 모든 호스트 허용)"
        status = "취약"

    return result_dict(code, name, imp, status, evidence, purpose)


# ──────────────────────────────────────────────
# U-51  DNS 서비스의 취약한 동적 업데이트 설정 금지
# ──────────────────────────────────────────────
def check_u51():
    code, name, imp = "U-51", "DNS 서비스의 취약한 동적 업데이트 설정 금지", "중"
    purpose = "DNS 동적 업데이트가 비활성화되어 있거나 인증된 업데이트만 허용하는지 확인"
    evidence = {}

    named_conf = None
    for fp in ("/etc/named.conf", "/etc/bind/named.conf"):
        content = read_file_contents(fp)
        if content:
            named_conf = content
            break

    if named_conf is None:
        if not process_running("named"):
            return result_dict(code, name, imp, "N/A", {"note": "DNS 서비스 미사용"}, purpose)
        return result_dict(code, name, imp, "수동점검필요", evidence, purpose)

    m = re.search(r"allow-update\s*\{([^}]+)\}", named_conf)
    if m:
        val = m.group(1).strip()
        evidence["allow-update"] = val
        if val in ("none;", "none ;"):
            status = "양호"
        elif "any" in val:
            status = "취약"
        else:
            status = "양호"
    else:
        evidence["allow-update"] = "미설정(기본값: none)"
        status = "양호"

    return result_dict(code, name, imp, status, evidence, purpose)


# ──────────────────────────────────────────────
# U-52  Telnet 서비스 비활성화
# ──────────────────────────────────────────────
def check_u52():
    code, name, imp = "U-52", "Telnet 서비스 비활성화", "중"
    purpose = "평문 전송되는 Telnet 서비스 비활성화 확인"
    evidence = {}

    active = (
        is_service_active("telnet.socket") or
        is_service_active("telnetd") or
        is_service_active("telnet") or
        process_running("in\\.telnetd|telnetd")
    )
    evidence["telnet_active"] = active
    status = "양호" if not active else "취약"
    return result_dict(code, name, imp, status, evidence, purpose)


# ──────────────────────────────────────────────
# U-53  FTP 서비스 정보 노출 제한
# ──────────────────────────────────────────────
def check_u53():
    code, name, imp = "U-53", "FTP 서비스 정보 노출 제한", "하"
    purpose = "FTP 서비스 배너에 버전 정보 등이 노출되지 않도록 확인"
    evidence = {}

    if not service_running_any(["vsftpd", "proftpd", "pure-ftpd"]):
        return result_dict(code, name, imp, "N/A", {"note": "FTP 서비스 미사용"}, purpose)

    # vsftpd
    for fp in ("/etc/vsftpd.conf", "/etc/vsftpd/vsftpd.conf"):
        content = read_file_contents(fp)
        if content:
            m = re.search(r"^\s*ftpd_banner\s*=\s*(.+)", content, re.MULTILINE)
            if m:
                evidence["ftpd_banner"] = m.group(1)
            else:
                evidence["ftpd_banner"] = "미설정(기본 배너 사용)"

    evidence["note"] = "FTP 배너 정보 노출 여부는 수동 확인 권고"
    return result_dict(code, name, imp, "수동점검필요", evidence, purpose)


# ──────────────────────────────────────────────
# U-54  암호화되지 않는 FTP 서비스 비활성화
# ──────────────────────────────────────────────
def check_u54():
    code, name, imp = "U-54", "암호화되지 않는 FTP 서비스 비활성화", "중"
    purpose = "평문 FTP 대신 SFTP/FTPS 사용 여부 확인"
    evidence = {}

    ftp_active = service_running_any(["vsftpd", "proftpd", "pure-ftpd"]) or process_running("vsftpd|proftpd|pure-ftpd")
    evidence["ftp_service_active"] = ftp_active

    if ftp_active:
        # SSL/TLS 설정 확인
        for fp in ("/etc/vsftpd.conf", "/etc/vsftpd/vsftpd.conf"):
            content = read_file_contents(fp)
            if content:
                m = re.search(r"^\s*ssl_enable\s*=\s*(\S+)", content, re.MULTILINE | re.IGNORECASE)
                if m:
                    evidence["vsftpd_ssl_enable"] = m.group(1)
        evidence["note"] = "SFTP(SSH 기반) 사용 권고, 평문 FTP 비활성화 필요"
        status = "취약"
    else:
        status = "양호"

    return result_dict(code, name, imp, status, evidence, purpose)


# ──────────────────────────────────────────────
# U-55  FTP 계정 Shell 제한
# ──────────────────────────────────────────────
def check_u55():
    code, name, imp = "U-55", "FTP 계정 Shell 제한", "중"
    purpose = "FTP 전용 계정의 쉘이 /bin/false 또는 /sbin/nologin인지 확인"
    evidence = {}
    NOLOGIN = {"/bin/false", "/sbin/nologin", "/usr/sbin/nologin"}

    passwd = read_file_contents("/etc/passwd")
    if not passwd:
        return result_dict(code, name, imp, "수동점검필요", {"error": "/etc/passwd 읽기 불가"}, purpose)

    ftp_accounts = []
    for line in passwd.splitlines():
        p = line.strip().split(":")
        if len(p) >= 7 and p[0] in ("ftp", "anonymous"):
            ftp_accounts.append({"user": p[0], "shell": p[6]})

    evidence["ftp_accounts"] = ftp_accounts
    if not ftp_accounts:
        return result_dict(code, name, imp, "양호", evidence, purpose)

    vuln = [a for a in ftp_accounts if a["shell"] not in NOLOGIN]
    status = "양호" if len(vuln) == 0 else "취약"
    return result_dict(code, name, imp, status, evidence, purpose)


# ──────────────────────────────────────────────
# U-56  FTP 서비스 접근 제어 설정
# ──────────────────────────────────────────────
def check_u56():
    code, name, imp = "U-56", "FTP 서비스 접근 제어 설정", "하"
    purpose = "FTP 접근 제어(TCP Wrapper 또는 방화벽) 설정 확인"
    evidence = {}

    if not service_running_any(["vsftpd", "proftpd", "pure-ftpd"]):
        return result_dict(code, name, imp, "N/A", {"note": "FTP 서비스 미사용"}, purpose)

    # TCP Wrapper
    allow = read_file_contents("/etc/hosts.allow")
    deny = read_file_contents("/etc/hosts.deny")
    found = False
    if deny and re.search(r"ALL\s*:\s*ALL", deny):
        found = True
        evidence["hosts.deny"] = "ALL:ALL 설정됨"
    if allow and re.search(r"vsftpd|proftpd|ftp", allow, re.IGNORECASE):
        evidence["hosts.allow_ftp"] = True
        found = True

    # vsftpd tcp_wrappers
    for fp in ("/etc/vsftpd.conf", "/etc/vsftpd/vsftpd.conf"):
        c = read_file_contents(fp)
        if c:
            m = re.search(r"^\s*tcp_wrappers\s*=\s*(\S+)", c, re.MULTILINE | re.IGNORECASE)
            if m:
                evidence["vsftpd_tcp_wrappers"] = m.group(1)
                if m.group(1).upper() == "YES":
                    found = True

    status = "양호" if found else "수동점검필요"
    return result_dict(code, name, imp, status, evidence, purpose)


# ──────────────────────────────────────────────
# U-57  Ftpusers 파일 설정
# ──────────────────────────────────────────────
def check_u57():
    code, name, imp = "U-57", "Ftpusers 파일 설정", "중"
    purpose = "ftpusers 파일에 root 계정이 등록되어 FTP 접근이 차단되는지 확인"
    evidence = {}

    ftpusers_paths = ["/etc/ftpusers", "/etc/vsftpd/ftpusers", "/etc/vsftpd.ftpusers",
                      "/etc/vsftpd/user_list", "/etc/vsftpd.user_list"]
    found_root = False
    for fp in ftpusers_paths:
        content = read_file_contents(fp)
        if content:
            users = [l.strip() for l in content.splitlines() if l.strip() and not l.strip().startswith("#")]
            evidence[fp] = users
            if "root" in users:
                found_root = True

    if not service_running_any(["vsftpd", "proftpd", "pure-ftpd"]):
        return result_dict(code, name, imp, "N/A", {"note": "FTP 서비스 미사용"}, purpose)

    status = "양호" if found_root else "취약"
    return result_dict(code, name, imp, status, evidence, purpose)


# ──────────────────────────────────────────────
# U-58  불필요한 SNMP 서비스 구동 점검
# ──────────────────────────────────────────────
def check_u58():
    code, name, imp = "U-58", "불필요한 SNMP 서비스 구동 점검", "중"
    purpose = "불필요한 SNMP 서비스 비활성화 확인"
    evidence = {}

    active = is_service_active("snmpd") or process_running("snmpd")
    evidence["snmpd_active"] = active
    status = "수동점검필요" if active else "양호"
    if active:
        evidence["note"] = "SNMP 사용 여부를 확인하여 불필요 시 비활성화 필요"
    return result_dict(code, name, imp, status, evidence, purpose)


# ──────────────────────────────────────────────
# U-59  안전한 SNMP 버전 사용
# ──────────────────────────────────────────────
def check_u59():
    code, name, imp = "U-59", "안전한 SNMP 버전 사용", "상"
    purpose = "SNMPv3 이상 사용 여부 확인"
    evidence = {}

    if not (is_service_active("snmpd") or process_running("snmpd")):
        return result_dict(code, name, imp, "N/A", {"note": "SNMP 서비스 미사용"}, purpose)

    snmpd_conf = read_file_contents("/etc/snmp/snmpd.conf")
    if snmpd_conf:
        # v3 사용자 설정 확인
        has_v3 = bool(re.search(r"^\s*(createUser|rouser|rwuser)", snmpd_conf, re.MULTILINE))
        # v1/v2c community 확인
        has_v1v2 = bool(re.search(r"^\s*(rocommunity|rwcommunity)\s+", snmpd_conf, re.MULTILINE))
        evidence["snmpv3_configured"] = has_v3
        evidence["snmpv1v2_configured"] = has_v1v2
        if has_v3 and not has_v1v2:
            status = "양호"
        else:
            status = "취약"
    else:
        evidence["error"] = "snmpd.conf 읽기 불가"
        status = "수동점검필요"

    return result_dict(code, name, imp, status, evidence, purpose)


# ──────────────────────────────────────────────
# U-60  SNMP Community String 복잡성 설정
# ──────────────────────────────────────────────
def check_u60():
    code, name, imp = "U-60", "SNMP Community String 복잡성 설정", "중"
    purpose = "SNMP Community String이 public/private 등 기본값이 아닌지 확인"
    evidence = {}

    if not (is_service_active("snmpd") or process_running("snmpd")):
        return result_dict(code, name, imp, "N/A", {"note": "SNMP 서비스 미사용"}, purpose)

    WEAK_STRINGS = {"public", "private", "community", "snmp", "default", "test"}
    snmpd_conf = read_file_contents("/etc/snmp/snmpd.conf")
    if snmpd_conf:
        communities = []
        for m in re.finditer(r"^\s*(?:ro|rw)community\s+(\S+)", snmpd_conf, re.MULTILINE):
            communities.append(m.group(1))
        evidence["communities"] = communities
        weak = [c for c in communities if c.lower() in WEAK_STRINGS]
        evidence["weak_communities"] = weak
        status = "양호" if len(weak) == 0 else "취약"
    else:
        status = "수동점검필요"

    return result_dict(code, name, imp, status, evidence, purpose)


# ──────────────────────────────────────────────
# U-61  SNMP Access Control 설정
# ──────────────────────────────────────────────
def check_u61():
    code, name, imp = "U-61", "SNMP Access Control 설정", "상"
    purpose = "SNMP 접근 통제(IP 제한 등) 설정 확인"
    evidence = {}

    if not (is_service_active("snmpd") or process_running("snmpd")):
        return result_dict(code, name, imp, "N/A", {"note": "SNMP 서비스 미사용"}, purpose)

    snmpd_conf = read_file_contents("/etc/snmp/snmpd.conf")
    if snmpd_conf:
        # 접근 제한 설정 존재 여부
        has_acl = bool(re.search(r"^\s*(com2sec|access|view|group)", snmpd_conf, re.MULTILINE))
        evidence["acl_configured"] = has_acl
        # agentAddress 제한
        m = re.search(r"^\s*agentAddress\s+(.+)", snmpd_conf, re.MULTILINE)
        if m:
            evidence["agentAddress"] = m.group(1)
        status = "양호" if has_acl else "취약"
    else:
        status = "수동점검필요"

    return result_dict(code, name, imp, status, evidence, purpose)


# ──────────────────────────────────────────────
# U-62  로그인 시 경고 메시지 설정
# ──────────────────────────────────────────────
def check_u62():
    code, name, imp = "U-62", "로그인 시 경고 메시지 설정", "하"
    purpose = "로그인 배너에 경고 메시지가 설정되어 있는지 확인"
    evidence = {}

    banner_files = {
        "/etc/motd": read_file_contents("/etc/motd"),
        "/etc/issue": read_file_contents("/etc/issue"),
        "/etc/issue.net": read_file_contents("/etc/issue.net"),
    }
    has_banner = False
    for fp, content in banner_files.items():
        if content and content.strip():
            evidence[fp] = content.strip()[:200]
            has_banner = True

    # SSH Banner 설정
    ssh_conf = read_file_contents("/etc/ssh/sshd_config")
    if ssh_conf:
        m = re.search(r"^\s*Banner\s+(\S+)", ssh_conf, re.MULTILINE)
        if m:
            evidence["ssh_banner"] = m.group(1)
            has_banner = True

    status = "양호" if has_banner else "취약"
    return result_dict(code, name, imp, status, evidence, purpose)


# ──────────────────────────────────────────────
# U-63  sudo 명령어 접근 관리
# ──────────────────────────────────────────────
def check_u63():
    code, name, imp = "U-63", "sudo 명령어 접근 관리", "중"
    purpose = "sudo 설정에서 불필요한 ALL 권한 부여 여부 확인"
    evidence = {}

    sudoers = read_file_contents("/etc/sudoers")
    if sudoers is None:
        return result_dict(code, name, imp, "수동점검필요", {"error": "/etc/sudoers 읽기 불가"}, purpose)

    # NOPASSWD: ALL 또는 ALL=(ALL) ALL 이 일반 사용자에게 부여되었는지
    vuln_lines = []
    for line in sudoers.splitlines():
        stripped = line.strip()
        if stripped.startswith("#") or not stripped:
            continue
        if "ALL" in stripped and "NOPASSWD" in stripped:
            if not stripped.startswith("root") and not stripped.startswith("%wheel") and not stripped.startswith("%sudo"):
                vuln_lines.append(stripped)

    evidence["nopasswd_all_lines"] = vuln_lines
    evidence["note"] = "sudo 설정의 적정성은 수동 확인 필요"

    # /etc/sudoers.d/ 디렉터리 내 추가 설정 존재 여부
    if os.path.isdir("/etc/sudoers.d"):
        rc, out, _ = run_cmd("ls /etc/sudoers.d/ 2>/dev/null")
        evidence["sudoers.d_files"] = out.strip().splitlines() if out else []

    status = "수동점검필요"
    return result_dict(code, name, imp, status, evidence, purpose)


# ──────────────────────────────────────────────
# U-64  주기적 보안 패치 및 벤더 권고사항 적용
# ──────────────────────────────────────────────
def check_u64():
    code, name, imp = "U-64", "주기적 보안 패치 및 벤더 권고사항 적용", "상"
    purpose = "OS 및 주요 패키지에 최신 보안 패치가 적용되었는지 확인"
    evidence = {}

    # 커널 버전
    rc, out, _ = run_cmd("uname -r")
    evidence["kernel_version"] = out.strip() if rc == 0 else "확인 불가"

    # OS 정보
    rc, out, _ = run_cmd("cat /etc/os-release 2>/dev/null | head -5")
    evidence["os_info"] = out.strip() if rc == 0 else ""

    # 업데이트 가능 패키지 수
    if DISTRO == "redhat":
        rc, out, _ = run_cmd("yum check-update --quiet 2>/dev/null | wc -l", timeout=60)
        if rc in (0, 100):  # 100 = updates available
            evidence["yum_updates_count"] = out.strip()
    elif DISTRO == "debian":
        run_cmd("apt-get update -qq 2>/dev/null", timeout=60)
        rc, out, _ = run_cmd("apt list --upgradable 2>/dev/null | wc -l", timeout=30)
        if rc == 0:
            evidence["apt_updates_count"] = out.strip()

    # 마지막 업데이트 일시
    if DISTRO == "redhat":
        rc, out, _ = run_cmd("rpm -qa --last 2>/dev/null | head -1")
        evidence["last_package_update"] = out.strip() if rc == 0 else ""
    elif DISTRO == "debian":
        rc, out, _ = run_cmd("stat /var/log/apt/history.log 2>/dev/null | grep Modify")
        evidence["last_apt_log_modify"] = out.strip() if rc == 0 else ""

    evidence["note"] = "패치 적용 상태는 벤더 권고사항과 대조하여 수동 확인 필요"
    status = "수동점검필요"
    return result_dict(code, name, imp, status, evidence, purpose)


# ──────────────────────────────────────────────
# U-65  NTP 및 시각 동기화 설정
# ──────────────────────────────────────────────
def check_u65():
    code, name, imp = "U-65", "NTP 및 시각 동기화 설정", "중"
    purpose = "NTP 또는 chrony를 통한 시각 동기화 설정 확인"
    evidence = {}

    # chronyd
    chrony_active = is_service_active("chronyd") or is_service_active("chrony")
    evidence["chronyd_active"] = chrony_active

    # ntpd
    ntp_active = is_service_active("ntpd") or is_service_active("ntp")
    evidence["ntpd_active"] = ntp_active

    # systemd-timesyncd
    timesyncd = is_service_active("systemd-timesyncd")
    evidence["systemd-timesyncd_active"] = timesyncd

    if chrony_active:
        rc, out, _ = run_cmd("chronyc sources 2>/dev/null | head -10")
        evidence["chrony_sources"] = out.strip() if rc == 0 else ""

    if ntp_active:
        rc, out, _ = run_cmd("ntpq -p 2>/dev/null | head -10")
        evidence["ntp_peers"] = out.strip() if rc == 0 else ""

    synced = chrony_active or ntp_active or timesyncd
    status = "양호" if synced else "취약"
    return result_dict(code, name, imp, status, evidence, purpose)


# ──────────────────────────────────────────────
# U-66  정책에 따른 시스템 로깅 설정
# ──────────────────────────────────────────────
def check_u66():
    code, name, imp = "U-66", "정책에 따른 시스템 로깅 설정", "중"
    purpose = "rsyslog/syslog 서비스의 로깅 설정 적절성 확인"
    evidence = {}

    # rsyslog
    rsyslog_active = is_service_active("rsyslog") or is_service_active("syslog")
    evidence["rsyslog_active"] = rsyslog_active

    conf = None
    for fp in ("/etc/rsyslog.conf", "/etc/syslog.conf"):
        c = read_file_contents(fp)
        if c:
            conf = c
            evidence["config_file"] = fp
            break

    if conf:
        # 주요 로그 facility 확인
        facilities = {}
        for fac in ("auth", "authpriv", "daemon", "kern", "cron"):
            if re.search(rf"^\s*{fac}\.", conf, re.MULTILINE):
                facilities[fac] = True
            else:
                facilities[fac] = False
        evidence["logging_facilities"] = facilities
        # 핵심 facility 최소 auth, authpriv 로깅 확인
        if facilities.get("auth") or facilities.get("authpriv"):
            status = "양호"
        else:
            status = "취약"
    else:
        # journald만 사용하는 시스템
        if is_service_active("systemd-journald"):
            evidence["journald_active"] = True
            status = "양호"
        else:
            status = "취약"

    return result_dict(code, name, imp, status, evidence, purpose)


# ──────────────────────────────────────────────
# U-67  로그 디렉터리 소유자 및 권한 설정
# ──────────────────────────────────────────────
def check_u67():
    code, name, imp = "U-67", "로그 디렉터리 소유자 및 권한 설정", "중"
    purpose = "로그 디렉터리(/var/log) 소유자 및 권한 적정성 확인"
    evidence = {}
    vuln = []

    log_dirs = ["/var/log"]
    for d in log_dirs:
        owner, perm = file_owner_and_perm(d)
        if owner is not None:
            evidence[d] = {"owner": owner, "perm": perm}
            if owner != "root":
                vuln.append(f"{d}: owner={owner}")
            if perm and not perm_le(perm, "0o755"):
                vuln.append(f"{d}: perm={perm}")

    # 주요 로그 파일 권한 확인
    important_logs = ["/var/log/messages", "/var/log/syslog", "/var/log/secure",
                      "/var/log/auth.log", "/var/log/wtmp", "/var/log/lastlog"]
    for fp in important_logs:
        owner, perm = file_owner_and_perm(fp)
        if owner is not None:
            ok = (owner in ("root", "syslog")) and perm_le(perm, "0o640")
            evidence[fp] = {"owner": owner, "perm": perm, "ok": ok}
            if not ok:
                vuln.append(fp)

    evidence["vulnerable"] = vuln
    status = "양호" if len(vuln) == 0 else "취약"
    return result_dict(code, name, imp, status, evidence, purpose)


# ──────────────────────────────────────────────
# MAIN
# ──────────────────────────────────────────────

ALL_CHECKS = [
    check_u01, check_u02, check_u03, check_u04, check_u05,
    check_u06, check_u07, check_u08, check_u09, check_u10,
    check_u11, check_u12, check_u13, check_u14, check_u15,
    check_u16, check_u17, check_u18, check_u19, check_u20,
    check_u21, check_u22, check_u23, check_u24, check_u25,
    check_u26, check_u27, check_u28, check_u29, check_u30,
    check_u31, check_u32, check_u33, check_u34, check_u35,
    check_u36, check_u37, check_u38, check_u39, check_u40,
    check_u41, check_u42, check_u43, check_u44, check_u45,
    check_u46, check_u47, check_u48, check_u49, check_u50,
    check_u51, check_u52, check_u53, check_u54, check_u55,
    check_u56, check_u57, check_u58, check_u59, check_u60,
    check_u61, check_u62, check_u63, check_u64, check_u65,
    check_u66, check_u67,
]


def main():
    if os.geteuid() != 0:
        print("[경고] root 권한이 아닙니다. 일부 점검 항목이 정확하지 않을 수 있습니다.", file=sys.stderr)

    print(f"[*] 주요정보통신기반시설 Unix/Linux 서버 취약점 자동진단 시작")
    print(f"[*] 호스트명: {platform.node()}")
    print(f"[*] OS: {platform.platform()}")
    print(f"[*] 배포판 계열: {DISTRO}")
    print(f"[*] 점검 시각: {datetime.datetime.now().isoformat()}")
    print(f"[*] 총 점검 항목: {len(ALL_CHECKS)}개")
    print("-" * 60)

    results = []
    summary = {"양호": 0, "취약": 0, "N/A": 0, "수동점검필요": 0}

    for i, fn in enumerate(ALL_CHECKS, 1):
        try:
            r = fn()
        except Exception as e:
            r = {
                "항목코드": fn.__name__.replace("check_", "").upper(),
                "항목명": fn.__name__,
                "중요도": "-",
                "판정": "수동점검필요",
                "점검목적": "",
                "evidence": {"error": str(e)},
            }
        # 점검에 사용된 함수 소스코드 첨부
        try:
            r["점검코드"] = inspect.getsource(fn)
        except (OSError, TypeError):
            r["점검코드"] = f"# {fn.__name__} 소스 추출 불가"
        results.append(r)
        status = r["판정"]
        summary[status] = summary.get(status, 0) + 1

        icon = {"양호": "✔", "취약": "✘", "N/A": "-", "수동점검필요": "?"}.get(status, "?")
        print(f"  [{i:02d}/{len(ALL_CHECKS)}] {icon} {r['항목코드']} {r['항목명']} → {status}")

    print("-" * 60)
    print(f"[결과 요약]  양호: {summary['양호']}  |  취약: {summary['취약']}  "
          f"|  N/A: {summary['N/A']}  |  수동점검: {summary['수동점검필요']}")

    # JSON 파일 저장
    report = {
        "scan_info": {
            "hostname": platform.node(),
            "os": platform.platform(),
            "distro": DISTRO,
            "scan_time": datetime.datetime.now().isoformat(),
            "total_checks": len(ALL_CHECKS),
        },
        "summary": summary,
        "results": results,
    }

    outfile = f"security_audit_{platform.node()}_{datetime.datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
    with open(outfile, "w", encoding="utf-8") as f:
        json.dump(report, f, ensure_ascii=False, indent=2)

    print(f"\n[*] 결과 저장 완료: {outfile}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
