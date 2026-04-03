#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
주요정보통신기반시설 기술적 취약점 분석·평가 - Windows 서버 자동진단 도구
============================================================================
기준: 주요정보통신기반시설 기술적 취약점 분석·평가 상세가이드 (W-01 ~ W-64)
실행: 관리자(Administrator) 권한으로 실행
      python windows_security_audit.py
주의: 읽기 전용 점검만 수행하며, 시스템을 변경하지 않음
"""

import ctypes
import datetime
import inspect
import json
import os
import platform
import re
import subprocess
import sys
import tempfile
from pathlib import Path

# ──────────────────────────────────────────────
# 공통 유틸리티
# ──────────────────────────────────────────────

TIMEOUT = 30

def is_admin():
    """관리자 권한 여부 확인."""
    try:
        return ctypes.windll.shell32.IsUserAnAdmin() != 0
    except Exception:
        return False


def run_cmd(cmd, timeout=TIMEOUT, shell=True):
    """명령 실행 후 (returncode, stdout, stderr) 반환."""
    try:
        r = subprocess.run(
            cmd, shell=shell, capture_output=True, text=True, timeout=timeout,
            encoding="cp949", errors="replace"
        )
        return r.returncode, r.stdout.strip(), r.stderr.strip()
    except subprocess.TimeoutExpired:
        return -1, "", "TIMEOUT"
    except Exception as e:
        return -99, "", str(e)


def run_ps(script, timeout=TIMEOUT):
    """PowerShell 명령 실행. (returncode, stdout, stderr)."""
    cmd = [
        "powershell.exe", "-NoProfile", "-NonInteractive",
        "-ExecutionPolicy", "Bypass", "-Command", script
    ]
    try:
        r = subprocess.run(
            cmd, capture_output=True, text=True, timeout=timeout,
            encoding="cp949", errors="replace"
        )
        return r.returncode, r.stdout.strip(), r.stderr.strip()
    except subprocess.TimeoutExpired:
        return -1, "", "TIMEOUT"
    except Exception as e:
        return -99, "", str(e)


# secedit 정책 캐시
_SECEDIT_CACHE = None

def get_secedit_cfg():
    """secedit /export 로 로컬 보안 정책을 파싱하여 dict 반환."""
    global _SECEDIT_CACHE
    if _SECEDIT_CACHE is not None:
        return _SECEDIT_CACHE

    tmp = os.path.join(tempfile.gettempdir(), "secedit_export.cfg")
    rc, _, _ = run_cmd(f'secedit /export /cfg "{tmp}" /quiet', timeout=30)
    cfg = {}
    if rc == 0 and os.path.isfile(tmp):
        try:
            with open(tmp, "r", encoding="utf-16-le", errors="replace") as f:
                for line in f:
                    line = line.strip()
                    if "=" in line:
                        k, v = line.split("=", 1)
                        cfg[k.strip()] = v.strip()
        except Exception:
            pass
        finally:
            try:
                os.remove(tmp)
            except OSError:
                pass
    _SECEDIT_CACHE = cfg
    return cfg


def reg_value(path, name):
    """레지스트리 값 조회. 없으면 None."""
    rc, out, _ = run_ps(
        f'try {{ (Get-ItemProperty -Path "Registry::{path}" '
        f'-Name "{name}" -ErrorAction Stop)."{name}" }} '
        f'catch {{ Write-Output "REG_NOT_FOUND" }}'
    )
    if rc == 0 and out and out != "REG_NOT_FOUND":
        return out
    return None


def service_status(name):
    """서비스 상태 문자열 반환(Running/Stopped/NotFound 등)."""
    rc, out, _ = run_ps(
        f'try {{ (Get-Service -Name "{name}" -ErrorAction Stop).Status }} '
        f'catch {{ Write-Output "NotFound" }}'
    )
    return out if rc == 0 else "Unknown"


def service_start_type(name):
    """서비스 시작 유형(Automatic/Manual/Disabled/NotFound)."""
    rc, out, _ = run_ps(
        f'try {{ (Get-Service -Name "{name}" -ErrorAction Stop).StartType }} '
        f'catch {{ Write-Output "NotFound" }}'
    )
    return out if rc == 0 else "Unknown"


def result_dict(code, name, importance, status, evidence, purpose=""):
    """결과 dict 생성."""
    return {
        "항목코드": code,
        "항목명": name,
        "중요도": importance,
        "판정": status,
        "점검목적": purpose,
        "evidence": evidence,
    }


# ══════════════════════════════════════════════
#  W-01  Administrator 계정 이름 변경 등 보안성 강화
# ══════════════════════════════════════════════
def check_w01():
    code, name, imp = "W-01", "Administrator 계정 이름 변경 등 보안성 강화", "상"
    purpose = "기본 관리자 계정인 Administrator 이름 변경 여부 점검"
    evidence = {}

    rc, out, _ = run_ps(
        "(Get-LocalUser | Where-Object { $_.SID -like 'S-1-5-*-500' }).Name"
    )
    if rc == 0 and out:
        evidence["admin_account_name"] = out
        status = "양호" if out.lower() != "administrator" else "취약"
    else:
        evidence["error"] = "관리자 계정 조회 실패"
        status = "수동점검필요"
    return result_dict(code, name, imp, status, evidence, purpose)


# ══════════════════════════════════════════════
#  W-02  Guest 계정 비활성화
# ══════════════════════════════════════════════
def check_w02():
    code, name, imp = "W-02", "Guest 계정 비활성화", "상"
    purpose = "Guest 계정을 비활성화하여 비인가 접근 차단"
    evidence = {}

    rc, out, _ = run_ps(
        "(Get-LocalUser -Name 'Guest' -ErrorAction SilentlyContinue).Enabled"
    )
    if rc == 0:
        evidence["guest_enabled"] = out
        status = "양호" if out.lower() == "false" else "취약"
    else:
        evidence["error"] = "Guest 계정 조회 실패"
        status = "수동점검필요"
    return result_dict(code, name, imp, status, evidence, purpose)


# ══════════════════════════════════════════════
#  W-03  불필요한 계정 제거
# ══════════════════════════════════════════════
def check_w03():
    code, name, imp = "W-03", "불필요한 계정 제거", "상"
    purpose = "불필요한 계정 존재 여부 점검"
    evidence = {}

    rc, out, _ = run_ps(
        "Get-LocalUser | Select-Object Name, Enabled, "
        "LastLogon, PasswordLastSet | ConvertTo-Json -Compress"
    )
    if rc == 0 and out:
        try:
            users = json.loads(out)
            if isinstance(users, dict):
                users = [users]
            evidence["local_users"] = [u.get("Name", "") for u in users]
            evidence["enabled_users"] = [
                u.get("Name", "") for u in users
                if str(u.get("Enabled", "")).lower() == "true"
            ]
        except json.JSONDecodeError:
            evidence["raw"] = out[:500]
    evidence["note"] = "퇴직/전직/휴직 계정 여부는 수동 확인 필요"
    status = "수동점검필요"
    return result_dict(code, name, imp, status, evidence, purpose)


# ══════════════════════════════════════════════
#  W-04  계정 잠금 임계값 설정
# ══════════════════════════════════════════════
def check_w04():
    code, name, imp = "W-04", "계정 잠금 임계값 설정", "상"
    purpose = "계정 잠금 임계값이 5 이하로 설정되었는지 점검"
    evidence = {}

    cfg = get_secedit_cfg()
    val = cfg.get("LockoutBadCount", None)
    evidence["LockoutBadCount"] = val

    if val is None:
        status = "수동점검필요"
    else:
        try:
            n = int(val)
            if n == 0:
                status = "취약"
                evidence["note"] = "잠금 임계값이 0(미설정)"
            elif n <= 5:
                status = "양호"
            else:
                status = "취약"
        except ValueError:
            status = "수동점검필요"
    return result_dict(code, name, imp, status, evidence, purpose)


# ══════════════════════════════════════════════
#  W-05  해독 가능한 암호화를 사용하여 암호 저장 해제
# ══════════════════════════════════════════════
def check_w05():
    code, name, imp = "W-05", "해독 가능한 암호화를 사용하여 암호 저장 해제", "상"
    purpose = "해독 가능한 암호화 사용 비활성화 여부 점검"
    evidence = {}

    cfg = get_secedit_cfg()
    val = cfg.get("ClearTextPassword", None)
    evidence["ClearTextPassword"] = val

    if val is None:
        status = "수동점검필요"
    else:
        status = "양호" if val == "0" else "취약"
    return result_dict(code, name, imp, status, evidence, purpose)


# ══════════════════════════════════════════════
#  W-06  관리자 그룹에 최소한의 사용자 포함
# ══════════════════════════════════════════════
def check_w06():
    code, name, imp = "W-06", "관리자 그룹에 최소한의 사용자 포함", "상"
    purpose = "Administrators 그룹에 불필요한 계정 포함 여부 점검"
    evidence = {}

    rc, out, _ = run_ps(
        "(Get-LocalGroupMember -Group 'Administrators' -ErrorAction SilentlyContinue)"
        " | Select-Object -ExpandProperty Name"
    )
    if rc == 0 and out:
        members = [m.strip() for m in out.splitlines() if m.strip()]
        evidence["administrators_members"] = members
        evidence["count"] = len(members)
        status = "수동점검필요"
        evidence["note"] = "구성원의 적정성은 수동 확인 필요"
    else:
        evidence["error"] = "Administrators 그룹 조회 실패"
        status = "수동점검필요"
    return result_dict(code, name, imp, status, evidence, purpose)


# ══════════════════════════════════════════════
#  W-07  Everyone 사용 권한을 익명 사용자에 적용
# ══════════════════════════════════════════════
def check_w07():
    code, name, imp = "W-07", "Everyone 사용 권한을 익명 사용자에 적용", "중"
    purpose = "Everyone 사용 권한을 익명 사용자에 적용 비활성화 여부 점검"
    evidence = {}

    val = reg_value(
        r"HKEY_LOCAL_MACHINE\SYSTEM\CurrentControlSet\Control\Lsa",
        "EveryoneIncludesAnonymous"
    )
    evidence["EveryoneIncludesAnonymous"] = val
    if val is None:
        status = "수동점검필요"
    else:
        status = "양호" if val.strip() == "0" else "취약"
    return result_dict(code, name, imp, status, evidence, purpose)


# ══════════════════════════════════════════════
#  W-08  계정 잠금 기간 설정
# ══════════════════════════════════════════════
def check_w08():
    code, name, imp = "W-08", "계정 잠금 기간 설정", "중"
    purpose = "계정 잠금 기간 및 재설정 기간이 60분 이상인지 점검"
    evidence = {}

    cfg = get_secedit_cfg()
    duration = cfg.get("LockoutDuration", None)
    reset = cfg.get("ResetLockoutCount", None)
    evidence["LockoutDuration"] = duration
    evidence["ResetLockoutCount"] = reset

    if duration is None or reset is None:
        status = "수동점검필요"
    else:
        try:
            d = int(duration)
            r = int(reset)
            status = "양호" if d >= 60 and r >= 60 else "취약"
        except ValueError:
            status = "수동점검필요"
    return result_dict(code, name, imp, status, evidence, purpose)


# ══════════════════════════════════════════════
#  W-09  비밀번호 관리 정책 설정
# ══════════════════════════════════════════════
def check_w09():
    code, name, imp = "W-09", "비밀번호 관리 정책 설정", "상"
    purpose = "비밀번호 복잡성, 최소 길이, 최대/최소 사용 기간 설정 점검"
    evidence = {}

    cfg = get_secedit_cfg()
    complexity = cfg.get("PasswordComplexity", None)
    min_len = cfg.get("MinimumPasswordLength", None)
    max_age = cfg.get("MaximumPasswordAge", None)
    min_age = cfg.get("MinimumPasswordAge", None)
    history = cfg.get("PasswordHistorySize", None)

    evidence["PasswordComplexity"] = complexity
    evidence["MinimumPasswordLength"] = min_len
    evidence["MaximumPasswordAge"] = max_age
    evidence["MinimumPasswordAge"] = min_age
    evidence["PasswordHistorySize"] = history

    vuln_reasons = []
    try:
        if complexity != "1":
            vuln_reasons.append("복잡성 미사용")
        if min_len is None or int(min_len) < 8:
            vuln_reasons.append(f"최소 길이 부족({min_len})")
        if max_age is None or int(max_age) > 90 or int(max_age) == 0:
            vuln_reasons.append(f"최대 사용 기간 초과({max_age})")
        if min_age is None or int(min_age) < 1:
            vuln_reasons.append(f"최소 사용 기간 미달({min_age})")
    except (ValueError, TypeError):
        vuln_reasons.append("정책값 파싱 오류")

    evidence["vuln_reasons"] = vuln_reasons
    status = "양호" if not vuln_reasons else "취약"
    return result_dict(code, name, imp, status, evidence, purpose)


# ══════════════════════════════════════════════
#  W-10  마지막 사용자 이름 표시 안 함
# ══════════════════════════════════════════════
def check_w10():
    code, name, imp = "W-10", "마지막 사용자 이름 표시 안 함", "중"
    purpose = "로그인 화면에 마지막 사용자 이름 표시 안 함 설정 점검"
    evidence = {}

    val = reg_value(
        r"HKEY_LOCAL_MACHINE\SOFTWARE\Microsoft\Windows\CurrentVersion\Policies\System",
        "DontDisplayLastUserName"
    )
    evidence["DontDisplayLastUserName"] = val
    if val is None:
        status = "취약"
        evidence["note"] = "레지스트리 값 미설정(기본값: 표시)"
    else:
        status = "양호" if val.strip() == "1" else "취약"
    return result_dict(code, name, imp, status, evidence, purpose)


# ══════════════════════════════════════════════
#  W-11  로컬 로그온 허용
# ══════════════════════════════════════════════
def check_w11():
    code, name, imp = "W-11", "로컬 로그온 허용", "중"
    purpose = "로컬 로그온 허용 정책에 불필요한 계정 포함 여부 점검"
    evidence = {}

    cfg = get_secedit_cfg()
    val = cfg.get("SeInteractiveLogonRight", None)
    evidence["SeInteractiveLogonRight"] = val
    evidence["note"] = "Administrators, IUSR_ 외 다른 계정 존재 여부는 수동 확인 필요"
    status = "수동점검필요"
    return result_dict(code, name, imp, status, evidence, purpose)


# ══════════════════════════════════════════════
#  W-12  익명 SID/이름 변환 허용 해제
# ══════════════════════════════════════════════
def check_w12():
    code, name, imp = "W-12", "익명 SID/이름 변환 허용 해제", "중"
    purpose = "익명 SID/이름 변환 정책 비활성화 여부 점검"
    evidence = {}

    cfg = get_secedit_cfg()
    val = cfg.get("LSAAnonymousNameLookup", None)
    evidence["LSAAnonymousNameLookup"] = val

    if val is None:
        status = "수동점검필요"
    else:
        status = "양호" if val == "0" else "취약"
    return result_dict(code, name, imp, status, evidence, purpose)


# ══════════════════════════════════════════════
#  W-13  콘솔 로그온 시 로컬 계정에서 빈 암호 사용 제한
# ══════════════════════════════════════════════
def check_w13():
    code, name, imp = "W-13", "콘솔 로그온 시 로컬 계정에서 빈 암호 사용 제한", "중"
    purpose = "빈 비밀번호 사용 제한 정책 설정 점검"
    evidence = {}

    val = reg_value(
        r"HKEY_LOCAL_MACHINE\SYSTEM\CurrentControlSet\Control\Lsa",
        "LimitBlankPasswordUse"
    )
    evidence["LimitBlankPasswordUse"] = val
    if val is None:
        status = "수동점검필요"
    else:
        status = "양호" if val.strip() == "1" else "취약"
    return result_dict(code, name, imp, status, evidence, purpose)


# ══════════════════════════════════════════════
#  W-14  원격터미널 접속 가능한 사용자 그룹 제한
# ══════════════════════════════════════════════
def check_w14():
    code, name, imp = "W-14", "원격터미널 접속 가능한 사용자 그룹 제한", "중"
    purpose = "Remote Desktop Users 그룹에 불필요한 계정 포함 여부 점검"
    evidence = {}

    rc, out, _ = run_ps(
        "try { (Get-LocalGroupMember -Group 'Remote Desktop Users' "
        "-ErrorAction Stop) | Select-Object -ExpandProperty Name } "
        "catch { Write-Output 'GROUP_NOT_FOUND' }"
    )
    if rc == 0:
        if out == "GROUP_NOT_FOUND" or not out:
            evidence["rdp_users"] = []
            status = "수동점검필요"
            evidence["note"] = "Remote Desktop Users 그룹 없거나 비어있음"
        else:
            members = [m.strip() for m in out.splitlines() if m.strip()]
            evidence["rdp_users"] = members
            status = "수동점검필요"
            evidence["note"] = "구성원 적정성 수동 확인 필요"
    else:
        evidence["error"] = "조회 실패"
        status = "수동점검필요"
    return result_dict(code, name, imp, status, evidence, purpose)


# ══════════════════════════════════════════════
#  W-15  사용자 개인키 사용 시 암호 입력
# ══════════════════════════════════════════════
def check_w15():
    code, name, imp = "W-15", "사용자 개인키 사용 시 암호 입력", "상"
    purpose = "컴퓨터에 저장된 사용자 키에 대해 강력한 키 보호 사용 설정 점검"
    evidence = {}

    val = reg_value(
        r"HKEY_LOCAL_MACHINE\SOFTWARE\Policies\Microsoft\Cryptography",
        "ForceKeyProtection"
    )
    evidence["ForceKeyProtection"] = val
    if val is None:
        status = "취약"
        evidence["note"] = "레지스트리 값 미설정(기본: 사용자 알림 없음)"
    else:
        status = "양호" if val.strip() == "2" else "취약"
    return result_dict(code, name, imp, status, evidence, purpose)


# ══════════════════════════════════════════════
#  W-16  공유 권한 및 사용자 그룹 설정
# ══════════════════════════════════════════════
def check_w16():
    code, name, imp = "W-16", "공유 권한 및 사용자 그룹 설정", "상"
    purpose = "공유 디렉터리에 Everyone 권한 존재 여부 점검"
    evidence = {}

    rc, out, _ = run_ps(
        "Get-SmbShare | Where-Object { $_.Name -notlike '*$' } | "
        "ForEach-Object { $s=$_.Name; "
        "Get-SmbShareAccess -Name $s | Where-Object { $_.AccountName -eq 'Everyone' } | "
        "Select-Object @{N='Share';E={$s}}, AccountName, AccessRight } | "
        "ConvertTo-Json -Compress"
    )
    if rc == 0 and out:
        try:
            shares = json.loads(out)
            if isinstance(shares, dict):
                shares = [shares]
            evidence["everyone_shares"] = shares
            status = "취약" if shares else "양호"
        except json.JSONDecodeError:
            if out.strip() == "":
                evidence["everyone_shares"] = []
                status = "양호"
            else:
                evidence["raw"] = out[:500]
                status = "수동점검필요"
    else:
        evidence["everyone_shares"] = []
        status = "양호"
    return result_dict(code, name, imp, status, evidence, purpose)


# ══════════════════════════════════════════════
#  W-17  하드디스크 기본 공유 제거
# ══════════════════════════════════════════════
def check_w17():
    code, name, imp = "W-17", "하드디스크 기본 공유 제거", "상"
    purpose = "기본 공유(C$, D$, ADMIN$) 존재 및 AutoShareServer 레지스트리 점검"
    evidence = {}

    rc, out, _ = run_ps(
        "Get-SmbShare | Where-Object { $_.Name -match '^[A-Z]\\$|^ADMIN\\$' } | "
        "Select-Object Name | ConvertTo-Json -Compress"
    )
    default_shares = []
    if rc == 0 and out:
        try:
            items = json.loads(out)
            if isinstance(items, dict):
                items = [items]
            default_shares = [i.get("Name", "") for i in items]
        except json.JSONDecodeError:
            pass
    evidence["default_shares"] = default_shares

    auto_share = reg_value(
        r"HKEY_LOCAL_MACHINE\SYSTEM\CurrentControlSet\Services\lanmanserver\parameters",
        "AutoShareServer"
    )
    evidence["AutoShareServer"] = auto_share

    if auto_share == "0" and not default_shares:
        status = "양호"
    elif auto_share == "0":
        status = "수동점검필요"
        evidence["note"] = "AutoShareServer=0이나 기본 공유 존재"
    else:
        status = "취약"
    return result_dict(code, name, imp, status, evidence, purpose)


# ══════════════════════════════════════════════
#  W-18  불필요한 서비스 제거
# ══════════════════════════════════════════════
def check_w18():
    code, name, imp = "W-18", "불필요한 서비스 제거", "상"
    purpose = "불필요한 서비스 가동 여부 점검"
    evidence = {}

    unnecessary = [
        "Alerter", "ClipSrv", "Browser", "DHCP", "ERSvc",
        "Messenger", "mnmsrvc", "RasAuto", "RemoteRegistry",
        "RemoteAccess", "simptcp", "SNMP", "SNMPTRAP",
        "TlntSvr", "seclogon", "upnphost", "WinRM"
    ]
    running = []
    for svc in unnecessary:
        st = service_status(svc)
        if st == "Running":
            running.append(svc)

    evidence["checked_services"] = unnecessary
    evidence["running_unnecessary"] = running
    status = "양호" if not running else "취약"
    return result_dict(code, name, imp, status, evidence, purpose)


# ══════════════════════════════════════════════
#  W-19  불필요한 IIS 서비스 구동 점검
# ══════════════════════════════════════════════
def check_w19():
    code, name, imp = "W-19", "불필요한 IIS 서비스 구동 점검", "상"
    purpose = "IIS 서비스 구동 상태 점검"
    evidence = {}

    w3svc = service_status("W3SVC")
    iisadmin = service_status("IISADMIN")
    evidence["W3SVC"] = w3svc
    evidence["IISADMIN"] = iisadmin

    if w3svc == "NotFound" and iisadmin == "NotFound":
        status = "양호"
        evidence["note"] = "IIS 미설치"
    elif w3svc == "Running" or iisadmin == "Running":
        status = "수동점검필요"
        evidence["note"] = "IIS 구동 중 — 필요성 확인 필요"
    else:
        status = "양호"
    return result_dict(code, name, imp, status, evidence, purpose)


# ══════════════════════════════════════════════
#  W-20  NetBIOS 바인딩 서비스 구동 점검
# ══════════════════════════════════════════════
def check_w20():
    code, name, imp = "W-20", "NetBIOS 바인딩 서비스 구동 점검", "상"
    purpose = "NetBIOS over TCP/IP 바인딩 비활성화 여부 점검"
    evidence = {}

    rc, out, _ = run_ps(
        "Get-NetAdapter | ForEach-Object { "
        "$name = $_.Name; $idx = $_.InterfaceIndex; "
        "$nb = (Get-ItemProperty -Path "
        "\"Registry::HKEY_LOCAL_MACHINE\\SYSTEM\\CurrentControlSet\\Services\\NetBT\\Parameters\\Interfaces\\Tcpip_$($_.InterfaceGuid)\" "
        "-Name 'NetbiosOptions' -ErrorAction SilentlyContinue).NetbiosOptions; "
        "[PSCustomObject]@{Adapter=$name; NetbiosOptions=$nb} } | "
        "ConvertTo-Json -Compress"
    )
    if rc == 0 and out:
        try:
            adapters = json.loads(out)
            if isinstance(adapters, dict):
                adapters = [adapters]
            evidence["adapters"] = adapters
            # NetbiosOptions: 0=Default(DHCP), 1=Enable, 2=Disable
            vuln = [a for a in adapters if a.get("NetbiosOptions") != 2]
            status = "양호" if not vuln else "취약"
        except json.JSONDecodeError:
            evidence["raw"] = out[:500]
            status = "수동점검필요"
    else:
        evidence["error"] = "조회 실패"
        status = "수동점검필요"
    return result_dict(code, name, imp, status, evidence, purpose)


# ══════════════════════════════════════════════
#  W-21  암호화되지 않는 FTP 서비스 비활성화
# ══════════════════════════════════════════════
def check_w21():
    code, name, imp = "W-21", "암호화되지 않는 FTP 서비스 비활성화", "상"
    purpose = "FTP 서비스 비활성화 여부 점검"
    evidence = {}

    ftpsvc = service_status("FTPSVC")
    msftpsvc = service_status("MSFTPSVC")
    evidence["FTPSVC"] = ftpsvc
    evidence["MSFTPSVC"] = msftpsvc

    if ftpsvc in ("NotFound", "Stopped") and msftpsvc in ("NotFound", "Stopped"):
        status = "양호"
    else:
        status = "취약"
        evidence["note"] = "FTP 서비스 구동 중"
    return result_dict(code, name, imp, status, evidence, purpose)


# ══════════════════════════════════════════════
#  W-22  FTP 디렉토리 접근권한 설정
# ══════════════════════════════════════════════
def check_w22():
    code, name, imp = "W-22", "FTP 디렉토리 접근권한 설정", "상"
    purpose = "FTP 홈 디렉터리에 Everyone 권한 존재 여부 점검"
    evidence = {}

    ftpsvc = service_status("FTPSVC")
    msftpsvc = service_status("MSFTPSVC")
    if ftpsvc == "NotFound" and msftpsvc == "NotFound":
        return result_dict(code, name, imp, "N/A", {"note": "FTP 서비스 미설치"}, purpose)

    rc, out, _ = run_ps(
        "try { Import-Module WebAdministration -ErrorAction Stop; "
        "Get-WebSite | ForEach-Object { "
        "$b = $_ | Get-WebBinding | Where-Object { $_.protocol -eq 'ftp' }; "
        "if ($b) { $_.physicalPath } } } "
        "catch { Write-Output 'IIS_MODULE_ERROR' }"
    )
    evidence["ftp_paths"] = out
    evidence["note"] = "FTP 디렉터리 접근 권한은 수동 확인 필요"
    status = "수동점검필요"
    return result_dict(code, name, imp, status, evidence, purpose)


# ══════════════════════════════════════════════
#  W-23  공유 서비스에 대한 익명 접근 제한 설정
# ══════════════════════════════════════════════
def check_w23():
    code, name, imp = "W-23", "공유 서비스에 대한 익명 접근 제한 설정", "상"
    purpose = "공유 서비스 익명 접근 제한 설정 점검"
    evidence = {}

    val = reg_value(
        r"HKEY_LOCAL_MACHINE\SYSTEM\CurrentControlSet\Control\Lsa",
        "RestrictAnonymous"
    )
    evidence["RestrictAnonymous"] = val
    if val is None:
        status = "취약"
    else:
        status = "양호" if int(val) >= 1 else "취약"
    return result_dict(code, name, imp, status, evidence, purpose)


# ══════════════════════════════════════════════
#  W-24  FTP 접근 제어 설정
# ══════════════════════════════════════════════
def check_w24():
    code, name, imp = "W-24", "FTP 접근 제어 설정", "상"
    purpose = "FTP 접근 제어(IP 제한) 설정 점검"
    evidence = {}

    ftpsvc = service_status("FTPSVC")
    if ftpsvc == "NotFound":
        return result_dict(code, name, imp, "N/A", {"note": "FTP 서비스 미설치"}, purpose)

    evidence["note"] = "FTP 접근 제어 설정은 IIS 관리 콘솔에서 수동 확인 필요"
    status = "수동점검필요"
    return result_dict(code, name, imp, status, evidence, purpose)


# ══════════════════════════════════════════════
#  W-25  DNS Zone Transfer 설정
# ══════════════════════════════════════════════
def check_w25():
    code, name, imp = "W-25", "DNS Zone Transfer 설정", "상"
    purpose = "DNS Zone Transfer 제한 설정 점검"
    evidence = {}

    dns_status = service_status("DNS")
    evidence["DNS_service"] = dns_status

    if dns_status == "NotFound" or dns_status == "Stopped":
        return result_dict(code, name, imp, "양호", {"note": "DNS 서비스 미사용"}, purpose)

    rc, out, _ = run_ps(
        "try { Get-DnsServerZone -ErrorAction Stop | "
        "Select-Object ZoneName, ZoneType, SecureSecondaries | "
        "ConvertTo-Json -Compress } catch { Write-Output 'DNS_ERROR' }"
    )
    evidence["zones"] = out
    evidence["note"] = "DNS Zone Transfer 설정은 수동 확인 필요"
    status = "수동점검필요"
    return result_dict(code, name, imp, status, evidence, purpose)


# ══════════════════════════════════════════════
#  W-26  RDS(Remote Data Services) 제거
# ══════════════════════════════════════════════
def check_w26():
    code, name, imp = "W-26", "RDS(Remote Data Services) 제거", "상"
    purpose = "취약한 RDS 서비스 제거 여부 점검"
    evidence = {}

    # Windows 2008 이상은 기본 양호
    ver = platform.version()
    major = int(ver.split(".")[0]) if ver else 0
    if major >= 6:
        evidence["os_version"] = ver
        evidence["note"] = "Windows Server 2008 이상 — RDS 취약점 해당 없음"
        return result_dict(code, name, imp, "양호", evidence, purpose)

    rds_key = reg_value(
        r"HKEY_LOCAL_MACHINE\SYSTEM\CurrentControlSet\Services\W3SVC\Parameters\ADCLaunch\RDSServer.DataFactory",
        ""
    )
    evidence["RDSServer.DataFactory"] = rds_key
    status = "양호" if rds_key is None else "취약"
    return result_dict(code, name, imp, status, evidence, purpose)


# ══════════════════════════════════════════════
#  W-27  최신 Windows OS Build 버전 적용
# ══════════════════════════════════════════════
def check_w27():
    code, name, imp = "W-27", "최신 Windows OS Build 버전 적용", "상"
    purpose = "최신 Build 적용 여부 점검"
    evidence = {}

    rc, out, _ = run_ps(
        "[System.Environment]::OSVersion.Version.ToString()"
    )
    evidence["os_version"] = out

    rc2, build, _ = run_ps(
        "(Get-ItemProperty 'HKLM:\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion').CurrentBuildNumber"
    )
    evidence["build_number"] = build

    rc3, ubr, _ = run_ps(
        "(Get-ItemProperty 'HKLM:\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion').UBR"
    )
    evidence["UBR"] = ubr

    evidence["note"] = "최신 Build 여부는 벤더 권고사항과 대조하여 수동 확인 필요"
    status = "수동점검필요"
    return result_dict(code, name, imp, status, evidence, purpose)


# ══════════════════════════════════════════════
#  W-28  터미널 서비스 암호화 수준 설정
# ══════════════════════════════════════════════
def check_w28():
    code, name, imp = "W-28", "터미널 서비스 암호화 수준 설정", "중"
    purpose = "원격 데스크톱 암호화 수준 적절성 점검"
    evidence = {}

    val = reg_value(
        r"HKEY_LOCAL_MACHINE\SYSTEM\CurrentControlSet\Control\Terminal Server\WinStations\RDP-Tcp",
        "MinEncryptionLevel"
    )
    evidence["MinEncryptionLevel"] = val
    # 1=Low, 2=Client Compatible(Medium), 3=High
    if val is None:
        status = "수동점검필요"
    else:
        try:
            level = int(val)
            status = "양호" if level >= 2 else "취약"
        except ValueError:
            status = "수동점검필요"
    return result_dict(code, name, imp, status, evidence, purpose)


# ══════════════════════════════════════════════
#  W-29  불필요한 SNMP 서비스 구동 점검
# ══════════════════════════════════════════════
def check_w29():
    code, name, imp = "W-29", "불필요한 SNMP 서비스 구동 점검", "중"
    purpose = "SNMP 서비스 비활성화 여부 점검"
    evidence = {}

    snmp_st = service_status("SNMP")
    evidence["SNMP_status"] = snmp_st
    if snmp_st == "NotFound" or snmp_st == "Stopped":
        status = "양호"
    else:
        status = "수동점검필요"
        evidence["note"] = "SNMP 서비스 사용 중 — 필요성 확인 필요"
    return result_dict(code, name, imp, status, evidence, purpose)


# ══════════════════════════════════════════════
#  W-30  SNMP Community String 복잡성 설정
# ══════════════════════════════════════════════
def check_w30():
    code, name, imp = "W-30", "SNMP Community String 복잡성 설정", "중"
    purpose = "SNMP Community String이 public/private가 아닌지 점검"
    evidence = {}

    snmp_st = service_status("SNMP")
    if snmp_st == "NotFound" or snmp_st == "Stopped":
        return result_dict(code, name, imp, "양호", {"note": "SNMP 미사용"}, purpose)

    rc, out, _ = run_ps(
        "try { (Get-ItemProperty "
        "'Registry::HKEY_LOCAL_MACHINE\\SYSTEM\\CurrentControlSet\\Services\\SNMP\\Parameters\\ValidCommunities' "
        "-ErrorAction Stop).PSObject.Properties | "
        "Where-Object { $_.Name -notin 'PSPath','PSParentPath','PSChildName','PSProvider','PSDrive' } | "
        "Select-Object Name | ConvertTo-Json -Compress } "
        "catch { Write-Output 'NO_COMMUNITIES' }"
    )
    if out == "NO_COMMUNITIES":
        evidence["communities"] = []
        status = "수동점검필요"
    elif rc == 0 and out:
        try:
            comms = json.loads(out)
            if isinstance(comms, dict):
                comms = [comms]
            names = [c.get("Name", "").lower() for c in comms]
            evidence["communities"] = names
            weak = [n for n in names if n in ("public", "private")]
            status = "취약" if weak else "양호"
            if weak:
                evidence["weak_communities"] = weak
        except json.JSONDecodeError:
            evidence["raw"] = out[:300]
            status = "수동점검필요"
    else:
        status = "수동점검필요"
    return result_dict(code, name, imp, status, evidence, purpose)


# ══════════════════════════════════════════════
#  W-31  SNMP Access Control 설정
# ══════════════════════════════════════════════
def check_w31():
    code, name, imp = "W-31", "SNMP Access Control 설정", "중"
    purpose = "SNMP 패킷 접근 제어 설정 점검"
    evidence = {}

    snmp_st = service_status("SNMP")
    if snmp_st == "NotFound" or snmp_st == "Stopped":
        return result_dict(code, name, imp, "양호", {"note": "SNMP 미사용"}, purpose)

    rc, out, _ = run_ps(
        "try { (Get-ItemProperty "
        "'Registry::HKEY_LOCAL_MACHINE\\SYSTEM\\CurrentControlSet\\Services\\SNMP\\Parameters\\PermittedManagers' "
        "-ErrorAction Stop).PSObject.Properties | "
        "Where-Object { $_.Name -notin 'PSPath','PSParentPath','PSChildName','PSProvider','PSDrive' } | "
        "Select-Object Name, Value | ConvertTo-Json -Compress } "
        "catch { Write-Output 'NO_ACL' }"
    )
    evidence["permitted_managers"] = out
    if out == "NO_ACL":
        status = "취약"
        evidence["note"] = "SNMP 접근 제어 미설정(모든 호스트 허용)"
    else:
        status = "양호"
    return result_dict(code, name, imp, status, evidence, purpose)


# ══════════════════════════════════════════════
#  W-32  DNS 서비스 구동 점검
# ══════════════════════════════════════════════
def check_w32():
    code, name, imp = "W-32", "DNS 서비스 구동 점검", "중"
    purpose = "DNS 동적 업데이트 비활성화 여부 점검"
    evidence = {}

    dns_st = service_status("DNS")
    evidence["DNS_status"] = dns_st
    if dns_st == "NotFound" or dns_st == "Stopped":
        return result_dict(code, name, imp, "양호", {"note": "DNS 서비스 미사용"}, purpose)

    evidence["note"] = "DNS 동적 업데이트 설정은 DNS 관리 콘솔에서 수동 확인 필요"
    status = "수동점검필요"
    return result_dict(code, name, imp, status, evidence, purpose)


# ══════════════════════════════════════════════
#  W-33  HTTP/FTP/SMTP 배너 차단
# ══════════════════════════════════════════════
def check_w33():
    code, name, imp = "W-33", "HTTP/FTP/SMTP 배너 차단", "하"
    purpose = "HTTP/FTP/SMTP 배너 정보 노출 여부 점검"
    evidence = {}

    iis = service_status("W3SVC")
    evidence["W3SVC"] = iis
    evidence["note"] = "배너 차단 설정은 IIS 관리자에서 수동 확인 필요"
    status = "수동점검필요"
    return result_dict(code, name, imp, status, evidence, purpose)


# ══════════════════════════════════════════════
#  W-34  Telnet 서비스 비활성화
# ══════════════════════════════════════════════
def check_w34():
    code, name, imp = "W-34", "Telnet 서비스 비활성화", "중"
    purpose = "Telnet 서비스 비활성화 여부 점검"
    evidence = {}

    telnet_st = service_status("TlntSvr")
    evidence["TlntSvr_status"] = telnet_st
    if telnet_st == "NotFound" or telnet_st == "Stopped":
        status = "양호"
    else:
        status = "취약"
    return result_dict(code, name, imp, status, evidence, purpose)


# ══════════════════════════════════════════════
#  W-35  불필요한 ODBC/OLE-DB 데이터 소스와 드라이브 제거
# ══════════════════════════════════════════════
def check_w35():
    code, name, imp = "W-35", "불필요한 ODBC/OLE-DB 데이터 소스와 드라이브 제거", "중"
    purpose = "시스템 DSN에 불필요한 데이터 소스 존재 여부 점검"
    evidence = {}

    rc, out, _ = run_ps(
        "try { Get-OdbcDsn -DsnType System -ErrorAction Stop | "
        "Select-Object Name, DriverName | ConvertTo-Json -Compress } "
        "catch { Write-Output 'ODBC_ERROR' }"
    )
    if out == "ODBC_ERROR" or not out:
        evidence["system_dsn"] = []
        status = "양호"
    elif rc == 0:
        try:
            dsns = json.loads(out)
            if isinstance(dsns, dict):
                dsns = [dsns]
            evidence["system_dsn"] = dsns
            status = "수동점검필요" if dsns else "양호"
            if dsns:
                evidence["note"] = "데이터 소스 사용 여부 수동 확인 필요"
        except json.JSONDecodeError:
            evidence["raw"] = out[:300]
            status = "수동점검필요"
    else:
        status = "수동점검필요"
    return result_dict(code, name, imp, status, evidence, purpose)


# ══════════════════════════════════════════════
#  W-36  원격터미널 접속 타임아웃 설정
# ══════════════════════════════════════════════
def check_w36():
    code, name, imp = "W-36", "원격터미널 접속 타임아웃 설정", "중"
    purpose = "RDP 유휴 세션 타임아웃(30분 이하) 설정 점검"
    evidence = {}

    val = reg_value(
        r"HKEY_LOCAL_MACHINE\SOFTWARE\Policies\Microsoft\Windows NT\Terminal Services",
        "MaxIdleTime"
    )
    evidence["MaxIdleTime_policy"] = val

    val2 = reg_value(
        r"HKEY_LOCAL_MACHINE\SYSTEM\CurrentControlSet\Control\Terminal Server\WinStations\RDP-Tcp",
        "MaxIdleTime"
    )
    evidence["MaxIdleTime_rdp"] = val2

    timeout_ms = None
    for v in [val, val2]:
        if v is not None:
            try:
                timeout_ms = int(v)
                break
            except ValueError:
                pass

    if timeout_ms is None:
        status = "취약"
        evidence["note"] = "유휴 세션 제한 미설정"
    elif timeout_ms == 0:
        status = "취약"
        evidence["note"] = "유휴 세션 제한 없음(0)"
    elif timeout_ms <= 1800000:  # 30분 = 1800000ms
        status = "양호"
    else:
        status = "취약"
    return result_dict(code, name, imp, status, evidence, purpose)


# ══════════════════════════════════════════════
#  W-37  예약된 작업에 의심스러운 명령 등록 여부
# ══════════════════════════════════════════════
def check_w37():
    code, name, imp = "W-37", "예약된 작업에 의심스러운 명령이 등록되어 있는지 점검", "중"
    purpose = "예약 작업에 의심스러운 명령 등록 여부 점검"
    evidence = {}

    rc, out, _ = run_ps(
        "Get-ScheduledTask | Where-Object { $_.State -ne 'Disabled' } | "
        "Select-Object TaskName, TaskPath, "
        "@{N='Actions';E={($_.Actions | ForEach-Object { $_.Execute + ' ' + $_.Arguments }) -join '; '}} | "
        "ConvertTo-Json -Compress -Depth 2"
    )
    if rc == 0 and out:
        try:
            tasks = json.loads(out)
            if isinstance(tasks, dict):
                tasks = [tasks]
            evidence["active_task_count"] = len(tasks)
            # 샘플 최대 20개만
            evidence["tasks_sample"] = tasks[:20]
        except json.JSONDecodeError:
            evidence["raw"] = out[:1000]
    evidence["note"] = "예약 작업의 적정성은 수동 확인 필요"
    status = "수동점검필요"
    return result_dict(code, name, imp, status, evidence, purpose)


# ══════════════════════════════════════════════
#  W-38  주기적 보안 패치 및 벤더 권고사항 적용
# ══════════════════════════════════════════════
def check_w38():
    code, name, imp = "W-38", "주기적 보안 패치 및 벤더 권고사항 적용", "상"
    purpose = "최신 보안 패치 적용 여부 점검"
    evidence = {}

    rc, out, _ = run_ps(
        "Get-HotFix | Sort-Object InstalledOn -Descending -ErrorAction SilentlyContinue | "
        "Select-Object -First 5 HotFixID, InstalledOn | ConvertTo-Json -Compress"
    )
    if rc == 0 and out:
        try:
            evidence["recent_hotfixes"] = json.loads(out)
        except json.JSONDecodeError:
            evidence["raw"] = out[:500]
    else:
        evidence["hotfixes"] = "조회 실패"

    evidence["note"] = "패치 적용 상태는 벤더 권고사항과 대조하여 수동 확인 필요"
    status = "수동점검필요"
    return result_dict(code, name, imp, status, evidence, purpose)


# ══════════════════════════════════════════════
#  W-39  백신 프로그램 업데이트
# ══════════════════════════════════════════════
def check_w39():
    code, name, imp = "W-39", "백신 프로그램 업데이트", "상"
    purpose = "백신 프로그램 최신 업데이트 여부 점검"
    evidence = {}

    rc, out, _ = run_ps(
        "try { Get-MpComputerStatus -ErrorAction Stop | "
        "Select-Object AntivirusEnabled, AntivirusSignatureLastUpdated, "
        "AntispywareEnabled, AntispywareSignatureLastUpdated | "
        "ConvertTo-Json -Compress } catch { Write-Output 'DEFENDER_ERROR' }"
    )
    if out == "DEFENDER_ERROR":
        evidence["note"] = "Windows Defender 상태 조회 실패 — 타사 백신 수동 확인 필요"
        status = "수동점검필요"
    elif rc == 0 and out:
        try:
            info = json.loads(out)
            evidence.update(info)
            status = "수동점검필요"
            evidence["note"] = "업데이트 최신 여부는 수동 확인 필요"
        except json.JSONDecodeError:
            evidence["raw"] = out[:300]
            status = "수동점검필요"
    else:
        status = "수동점검필요"
    return result_dict(code, name, imp, status, evidence, purpose)


# ══════════════════════════════════════════════
#  W-40  정책에 따른 시스템 로깅 설정
# ══════════════════════════════════════════════
def check_w40():
    code, name, imp = "W-40", "정책에 따른 시스템 로깅 설정", "중"
    purpose = "감사 정책(로그온, 계정 관리, 정책 변경 등) 설정 점검"
    evidence = {}

    rc, out, _ = run_cmd("auditpol /get /category:*")
    if rc == 0 and out:
        evidence["audit_policy"] = out[:3000]
        # 핵심 항목 체크
        needed = ["로그온", "Logon", "계정 관리", "Account Management",
                   "정책 변경", "Policy Change", "권한 사용", "Privilege Use"]
        found = []
        for line in out.splitlines():
            for kw in needed:
                if kw.lower() in line.lower():
                    found.append(line.strip())
        evidence["key_policies"] = found
        no_audit = [f for f in found if "감사 없음" in f or "No Auditing" in f]
        status = "취약" if no_audit else "양호"
        evidence["no_audit_items"] = no_audit
    else:
        evidence["error"] = "auditpol 실행 실패"
        status = "수동점검필요"
    return result_dict(code, name, imp, status, evidence, purpose)


# ══════════════════════════════════════════════
#  W-41  NTP 및 시각 동기화 설정
# ══════════════════════════════════════════════
def check_w41():
    code, name, imp = "W-41", "NTP 및 시각 동기화 설정", "중"
    purpose = "NTP 시각 동기화 설정 여부 점검"
    evidence = {}

    w32time_st = service_status("W32Time")
    evidence["W32Time_status"] = w32time_st

    rc, out, _ = run_cmd("w32tm /query /status", timeout=10)
    evidence["w32tm_status"] = out if rc == 0 else "조회 실패"

    rc2, out2, _ = run_cmd("w32tm /query /source", timeout=10)
    evidence["time_source"] = out2 if rc2 == 0 else "조회 실패"

    if w32time_st == "Running" and out2 and "error" not in out2.lower():
        status = "양호"
    else:
        status = "취약"
    return result_dict(code, name, imp, status, evidence, purpose)


# ══════════════════════════════════════════════
#  W-42  이벤트 로그 관리 설정
# ══════════════════════════════════════════════
def check_w42():
    code, name, imp = "W-42", "이벤트 로그 관리 설정", "하"
    purpose = "이벤트 로그 최대 크기(10240KB 이상) 및 보관 설정 점검"
    evidence = {}

    log_names = ["Application", "Security", "System"]
    vuln = []
    for ln in log_names:
        rc, out, _ = run_ps(
            f"$l = Get-WinEvent -ListLog '{ln}' -ErrorAction SilentlyContinue; "
            f"[PSCustomObject]@{{LogName='{ln}'; MaxSizeKB=[math]::Round($l.MaximumSizeInBytes/1024); "
            f"LogMode=$l.LogMode}} | ConvertTo-Json -Compress"
        )
        if rc == 0 and out:
            try:
                info = json.loads(out)
                evidence[ln] = info
                max_kb = info.get("MaxSizeKB", 0)
                if max_kb < 10240:
                    vuln.append(f"{ln}: {max_kb}KB < 10240KB")
            except json.JSONDecodeError:
                evidence[ln] = out[:200]

    evidence["vuln_reasons"] = vuln
    status = "양호" if not vuln else "취약"
    return result_dict(code, name, imp, status, evidence, purpose)


# ══════════════════════════════════════════════
#  W-43  이벤트 로그 파일 접근 통제 설정
# ══════════════════════════════════════════════
def check_w43():
    code, name, imp = "W-43", "이벤트 로그 파일 접근 통제 설정", "중"
    purpose = "로그 디렉터리에 Everyone 권한 존재 여부 점검"
    evidence = {}

    log_dir = os.path.join(os.environ.get("SystemRoot", r"C:\Windows"), "System32", "config")
    rc, out, _ = run_ps(
        f"(Get-Acl '{log_dir}').Access | "
        f"Where-Object {{ $_.IdentityReference -eq 'Everyone' }} | "
        f"Select-Object IdentityReference, FileSystemRights | "
        f"ConvertTo-Json -Compress"
    )
    if rc == 0 and out:
        try:
            acl = json.loads(out)
            if isinstance(acl, dict):
                acl = [acl]
            evidence["everyone_acl"] = acl
            status = "취약" if acl else "양호"
        except json.JSONDecodeError:
            if not out.strip():
                evidence["everyone_acl"] = []
                status = "양호"
            else:
                evidence["raw"] = out[:300]
                status = "수동점검필요"
    else:
        evidence["everyone_acl"] = []
        status = "양호"
    return result_dict(code, name, imp, status, evidence, purpose)


# ══════════════════════════════════════════════
#  W-44  원격으로 액세스할 수 있는 레지스트리 경로
# ══════════════════════════════════════════════
def check_w44():
    code, name, imp = "W-44", "원격으로 액세스할 수 있는 레지스트리 경로", "상"
    purpose = "Remote Registry 서비스 비활성화 여부 점검"
    evidence = {}

    rr_st = service_status("RemoteRegistry")
    evidence["RemoteRegistry_status"] = rr_st

    if rr_st in ("NotFound", "Stopped"):
        status = "양호"
    else:
        status = "취약"
    return result_dict(code, name, imp, status, evidence, purpose)


# ══════════════════════════════════════════════
#  W-45  백신 프로그램 설치
# ══════════════════════════════════════════════
def check_w45():
    code, name, imp = "W-45", "백신 프로그램 설치", "상"
    purpose = "백신 프로그램 설치 여부 점검"
    evidence = {}

    rc, out, _ = run_ps(
        "try { $d = Get-MpComputerStatus -ErrorAction Stop; "
        "$d.AntivirusEnabled } catch { Write-Output 'NO_DEFENDER' }"
    )
    if out == "NO_DEFENDER":
        # 타사 백신 확인
        rc2, out2, _ = run_ps(
            "Get-CimInstance -Namespace root/SecurityCenter2 -ClassName AntiVirusProduct "
            "-ErrorAction SilentlyContinue | Select-Object displayName | "
            "ConvertTo-Json -Compress"
        )
        if rc2 == 0 and out2 and "Error" not in out2:
            evidence["antivirus"] = out2
            status = "양호"
        else:
            evidence["note"] = "백신 프로그램 미확인 — 수동 확인 필요"
            status = "수동점검필요"
    else:
        evidence["defender_enabled"] = out
        status = "양호" if out.lower() == "true" else "취약"
    return result_dict(code, name, imp, status, evidence, purpose)


# ══════════════════════════════════════════════
#  W-46  SAM 파일 접근 통제 설정
# ══════════════════════════════════════════════
def check_w46():
    code, name, imp = "W-46", "SAM 파일 접근 통제 설정", "상"
    purpose = "SAM 파일 접근 권한에 Administrator, System 외 권한 존재 여부 점검"
    evidence = {}

    sam_path = os.path.join(os.environ.get("SystemRoot", r"C:\Windows"), "System32", "config", "SAM")
    rc, out, _ = run_ps(
        f"(Get-Acl '{sam_path}').Access | "
        f"Select-Object IdentityReference, FileSystemRights | "
        f"ConvertTo-Json -Compress"
    )
    if rc == 0 and out:
        try:
            acls = json.loads(out)
            if isinstance(acls, dict):
                acls = [acls]
            evidence["acl"] = acls
            allowed = {"nt authority\\system", "builtin\\administrators"}
            others = [a for a in acls
                      if a.get("IdentityReference", "").lower() not in allowed]
            status = "양호" if not others else "취약"
            if others:
                evidence["unexpected_acl"] = others
        except json.JSONDecodeError:
            evidence["raw"] = out[:300]
            status = "수동점검필요"
    else:
        evidence["error"] = "SAM 파일 ACL 조회 실패"
        status = "수동점검필요"
    return result_dict(code, name, imp, status, evidence, purpose)


# ══════════════════════════════════════════════
#  W-47  화면보호기 설정
# ══════════════════════════════════════════════
def check_w47():
    code, name, imp = "W-47", "화면보호기 설정", "하"
    purpose = "화면보호기 사용, 대기 10분 이하, 암호 보호 설정 점검"
    evidence = {}

    active = reg_value(
        r"HKEY_CURRENT_USER\Control Panel\Desktop", "ScreenSaveActive"
    )
    timeout_val = reg_value(
        r"HKEY_CURRENT_USER\Control Panel\Desktop", "ScreenSaveTimeOut"
    )
    secure = reg_value(
        r"HKEY_CURRENT_USER\Control Panel\Desktop", "ScreenSaverIsSecure"
    )
    evidence["ScreenSaveActive"] = active
    evidence["ScreenSaveTimeOut"] = timeout_val
    evidence["ScreenSaverIsSecure"] = secure

    vuln = []
    if active != "1":
        vuln.append("화면보호기 비활성화")
    if timeout_val:
        try:
            if int(timeout_val) > 600:
                vuln.append(f"대기시간 초과({timeout_val}초)")
        except ValueError:
            pass
    else:
        vuln.append("대기시간 미설정")
    if secure != "1":
        vuln.append("암호 보호 미사용")

    evidence["vuln_reasons"] = vuln
    status = "양호" if not vuln else "취약"
    return result_dict(code, name, imp, status, evidence, purpose)


# ══════════════════════════════════════════════
#  W-48  로그온하지 않고 시스템 종료 허용
# ══════════════════════════════════════════════
def check_w48():
    code, name, imp = "W-48", "로그온하지 않고 시스템 종료 허용", "상"
    purpose = "비 로그온 사용자의 시스템 종료 허용 여부 점검"
    evidence = {}

    val = reg_value(
        r"HKEY_LOCAL_MACHINE\SOFTWARE\Microsoft\Windows\CurrentVersion\Policies\System",
        "ShutdownWithoutLogon"
    )
    evidence["ShutdownWithoutLogon"] = val
    if val is None:
        status = "수동점검필요"
    else:
        status = "양호" if val.strip() == "0" else "취약"
    return result_dict(code, name, imp, status, evidence, purpose)


# ══════════════════════════════════════════════
#  W-49  원격 시스템에서 강제로 시스템 종료
# ══════════════════════════════════════════════
def check_w49():
    code, name, imp = "W-49", "원격 시스템에서 강제로 시스템 종료", "상"
    purpose = "원격 시스템 강제 종료 권한에 Administrators만 존재하는지 점검"
    evidence = {}

    cfg = get_secedit_cfg()
    val = cfg.get("SeRemoteShutdownPrivilege", None)
    evidence["SeRemoteShutdownPrivilege"] = val
    if val is None:
        status = "수동점검필요"
    else:
        sids = [s.strip() for s in val.split(",")]
        # *S-1-5-32-544 = Administrators
        status = "양호" if len(sids) == 1 and "S-1-5-32-544" in sids[0] else "수동점검필요"
        evidence["note"] = "구성원 적정성 수동 확인 필요"
    return result_dict(code, name, imp, status, evidence, purpose)


# ══════════════════════════════════════════════
#  W-50  보안 감사를 로그 할 수 없는 경우 즉시 시스템 종료
# ══════════════════════════════════════════════
def check_w50():
    code, name, imp = "W-50", "보안 감사를 로그 할 수 없는 경우 즉시 시스템 종료", "상"
    purpose = "해당 정책 비활성화 여부 점검"
    evidence = {}

    val = reg_value(
        r"HKEY_LOCAL_MACHINE\SYSTEM\CurrentControlSet\Control\Lsa",
        "CrashOnAuditFail"
    )
    evidence["CrashOnAuditFail"] = val
    if val is None:
        status = "양호"
        evidence["note"] = "레지스트리 값 미존재(기본: 비활성화)"
    else:
        status = "양호" if val.strip() == "0" else "취약"
    return result_dict(code, name, imp, status, evidence, purpose)


# ══════════════════════════════════════════════
#  W-51  SAM 계정과 공유의 익명 열거 허용 안 함
# ══════════════════════════════════════════════
def check_w51():
    code, name, imp = "W-51", "SAM 계정과 공유의 익명 열거 허용 안 함", "상"
    purpose = "SAM 계정 및 공유의 익명 열거 비허용 설정 점검"
    evidence = {}

    ra = reg_value(
        r"HKEY_LOCAL_MACHINE\SYSTEM\CurrentControlSet\Control\Lsa",
        "RestrictAnonymous"
    )
    ra_sam = reg_value(
        r"HKEY_LOCAL_MACHINE\SYSTEM\CurrentControlSet\Control\Lsa",
        "RestrictAnonymousSAM"
    )
    evidence["RestrictAnonymous"] = ra
    evidence["RestrictAnonymousSAM"] = ra_sam

    good = True
    if ra is None or int(ra) < 1:
        good = False
    if ra_sam is None or int(ra_sam) < 1:
        good = False
    status = "양호" if good else "취약"
    return result_dict(code, name, imp, status, evidence, purpose)


# ══════════════════════════════════════════════
#  W-52  Autologon 기능 제어
# ══════════════════════════════════════════════
def check_w52():
    code, name, imp = "W-52", "Autologon 기능 제어", "상"
    purpose = "AutoAdminLogon 비활성화 여부 점검"
    evidence = {}

    val = reg_value(
        r"HKEY_LOCAL_MACHINE\SOFTWARE\Microsoft\Windows NT\CurrentVersion\Winlogon",
        "AutoAdminLogon"
    )
    evidence["AutoAdminLogon"] = val
    if val is None or val.strip() == "0":
        status = "양호"
    else:
        status = "취약"

    dpw = reg_value(
        r"HKEY_LOCAL_MACHINE\SOFTWARE\Microsoft\Windows NT\CurrentVersion\Winlogon",
        "DefaultPassword"
    )
    evidence["DefaultPassword_exists"] = dpw is not None
    return result_dict(code, name, imp, status, evidence, purpose)


# ══════════════════════════════════════════════
#  W-53  이동식 미디어 포맷 및 꺼내기 허용
# ══════════════════════════════════════════════
def check_w53():
    code, name, imp = "W-53", "이동식 미디어 포맷 및 꺼내기 허용", "상"
    purpose = "이동식 미디어 포맷 및 꺼내기 허용 대상이 Administrators인지 점검"
    evidence = {}

    val = reg_value(
        r"HKEY_LOCAL_MACHINE\SOFTWARE\Microsoft\Windows NT\CurrentVersion\Winlogon",
        "AllocateDASD"
    )
    evidence["AllocateDASD"] = val
    # 0=Administrators, 1=Administrators+Power Users, 2=Administrators+Interactive Users
    if val is None or val.strip() == "0":
        status = "양호"
    else:
        status = "취약"
    return result_dict(code, name, imp, status, evidence, purpose)


# ══════════════════════════════════════════════
#  W-54  DoS 공격 방어 레지스트리 설정
# ══════════════════════════════════════════════
def check_w54():
    code, name, imp = "W-54", "DoS 공격 방어 레지스트리 설정", "중"
    purpose = "TCP/IP 스택 강화 레지스트리 설정 점검"
    evidence = {}
    base = r"HKEY_LOCAL_MACHINE\SYSTEM\CurrentControlSet\Services\Tcpip\Parameters"

    checks = {
        "SynAttackProtect": ("1", "이상"),
        "EnableDeadGWDetect": ("0", "일치"),
        "KeepAliveTime": ("300000", "이하"),
        "NoNameReleaseOnDemand": ("1", "일치"),
    }
    vuln = []
    for key, (expected, cmp_type) in checks.items():
        val = reg_value(base, key)
        evidence[key] = val
        if val is None:
            vuln.append(f"{key} 미설정")
        else:
            try:
                v = int(val)
                e = int(expected)
                if cmp_type == "이상" and v < e:
                    vuln.append(f"{key}={v} (기준: {e} 이상)")
                elif cmp_type == "이하" and v > e:
                    vuln.append(f"{key}={v} (기준: {e} 이하)")
                elif cmp_type == "일치" and v != e:
                    vuln.append(f"{key}={v} (기준: {e})")
            except ValueError:
                vuln.append(f"{key} 값 파싱 오류")

    evidence["vuln_reasons"] = vuln
    status = "양호" if not vuln else "취약"
    return result_dict(code, name, imp, status, evidence, purpose)


# ══════════════════════════════════════════════
#  W-55  사용자가 프린터 드라이버를 설치할 수 없게 함
# ══════════════════════════════════════════════
def check_w55():
    code, name, imp = "W-55", "사용자가 프린터 드라이버를 설치할 수 없게 함", "중"
    purpose = "프린터 드라이버 설치 제한 정책 설정 점검"
    evidence = {}

    val = reg_value(
        r"HKEY_LOCAL_MACHINE\SYSTEM\CurrentControlSet\Control\Print\Providers\LanMan Print Services\Servers",
        "AddPrinterDrivers"
    )
    evidence["AddPrinterDrivers"] = val
    if val is not None and val.strip() == "1":
        status = "양호"
    else:
        # 정책 기반 확인 fallback
        val2 = reg_value(
            r"HKEY_LOCAL_MACHINE\SYSTEM\CurrentControlSet\Control\Print",
            "AddPrinterDrivers"
        )
        evidence["AddPrinterDrivers_alt"] = val2
        if val2 is not None and val2.strip() == "1":
            status = "양호"
        else:
            status = "취약"
    return result_dict(code, name, imp, status, evidence, purpose)


# ══════════════════════════════════════════════
#  W-56  SMB 세션 중단 관리 설정
# ══════════════════════════════════════════════
def check_w56():
    code, name, imp = "W-56", "SMB 세션 중단 관리 설정", "중"
    purpose = "SMB 유휴 세션 및 로그온 시간 만료 설정 점검"
    evidence = {}

    auto_disconnect = reg_value(
        r"HKEY_LOCAL_MACHINE\SYSTEM\CurrentControlSet\Services\LanManServer\Parameters",
        "AutoDisconnect"
    )
    evidence["AutoDisconnect"] = auto_disconnect

    force_logoff = reg_value(
        r"HKEY_LOCAL_MACHINE\SYSTEM\CurrentControlSet\Services\LanManServer\Parameters",
        "EnableForcedLogoff"
    )
    evidence["EnableForcedLogoff"] = force_logoff

    vuln = []
    if auto_disconnect is None:
        vuln.append("AutoDisconnect 미설정")
    else:
        try:
            if int(auto_disconnect) > 15:
                vuln.append(f"AutoDisconnect={auto_disconnect} (기준: 15분 이하)")
        except ValueError:
            pass
    if force_logoff is None or force_logoff.strip() != "1":
        vuln.append("EnableForcedLogoff 미사용")

    evidence["vuln_reasons"] = vuln
    status = "양호" if not vuln else "취약"
    return result_dict(code, name, imp, status, evidence, purpose)


# ══════════════════════════════════════════════
#  W-57  로그온 시 경고 메시지 설정
# ══════════════════════════════════════════════
def check_w57():
    code, name, imp = "W-57", "로그온 시 경고 메시지 설정", "하"
    purpose = "로그온 경고 메시지 제목/내용 설정 여부 점검"
    evidence = {}

    caption = reg_value(
        r"HKEY_LOCAL_MACHINE\SOFTWARE\Microsoft\Windows\CurrentVersion\Policies\System",
        "LegalNoticeCaption"
    )
    text = reg_value(
        r"HKEY_LOCAL_MACHINE\SOFTWARE\Microsoft\Windows\CurrentVersion\Policies\System",
        "LegalNoticeText"
    )
    evidence["LegalNoticeCaption"] = caption
    evidence["LegalNoticeText"] = text[:200] if text else text

    if caption and text and len(caption.strip()) > 0 and len(text.strip()) > 0:
        status = "양호"
    else:
        status = "취약"
    return result_dict(code, name, imp, status, evidence, purpose)


# ══════════════════════════════════════════════
#  W-58  사용자별 홈 디렉터리 권한 설정
# ══════════════════════════════════════════════
def check_w58():
    code, name, imp = "W-58", "사용자별 홈 디렉터리 권한 설정", "중"
    purpose = "사용자 홈 디렉터리에 Everyone 권한 존재 여부 점검"
    evidence = {}

    users_dir = os.path.join(os.environ.get("SystemDrive", "C:"), "\\Users")
    rc, out, _ = run_ps(
        f"Get-ChildItem '{users_dir}' -Directory | "
        f"Where-Object {{ $_.Name -notin 'Public','Default','Default User','All Users' }} | "
        f"ForEach-Object {{ $n=$_.FullName; "
        f"$e=(Get-Acl $n).Access | Where-Object {{ $_.IdentityReference -eq 'Everyone' }}; "
        f"if ($e) {{ [PSCustomObject]@{{Path=$n; Everyone=$true}} }} }} | "
        f"ConvertTo-Json -Compress"
    )
    if rc == 0 and out:
        try:
            dirs = json.loads(out)
            if isinstance(dirs, dict):
                dirs = [dirs]
            evidence["everyone_homedirs"] = dirs
            status = "취약" if dirs else "양호"
        except json.JSONDecodeError:
            if not out.strip():
                evidence["everyone_homedirs"] = []
                status = "양호"
            else:
                evidence["raw"] = out[:300]
                status = "수동점검필요"
    else:
        evidence["everyone_homedirs"] = []
        status = "양호"
    return result_dict(code, name, imp, status, evidence, purpose)


# ══════════════════════════════════════════════
#  W-59  LAN Manager 인증 수준
# ══════════════════════════════════════════════
def check_w59():
    code, name, imp = "W-59", "LAN Manager 인증 수준", "중"
    purpose = "LAN Manager 인증 수준이 NTLMv2 이상인지 점검"
    evidence = {}

    val = reg_value(
        r"HKEY_LOCAL_MACHINE\SYSTEM\CurrentControlSet\Control\Lsa",
        "LmCompatibilityLevel"
    )
    evidence["LmCompatibilityLevel"] = val
    # 5 = NTLMv2 응답만 보내기(LM & NTLM 거부)
    if val is None:
        status = "취약"
        evidence["note"] = "미설정(기본값: LM & NTLM 응답 허용)"
    else:
        try:
            status = "양호" if int(val) >= 5 else "취약"
        except ValueError:
            status = "수동점검필요"
    return result_dict(code, name, imp, status, evidence, purpose)


# ══════════════════════════════════════════════
#  W-60  보안 채널 데이터 디지털 암호화 또는 서명
# ══════════════════════════════════════════════
def check_w60():
    code, name, imp = "W-60", "보안 채널 데이터 디지털 암호화 또는 서명", "중"
    purpose = "보안 채널 데이터 암호화/서명 관련 3개 정책 점검"
    evidence = {}
    base = r"HKEY_LOCAL_MACHINE\SYSTEM\CurrentControlSet\Services\Netlogon\Parameters"

    keys = {
        "RequireSignOrSeal": "암호화 또는 서명(항상)",
        "SealSecureChannel": "디지털 암호화(가능한 경우)",
        "SignSecureChannel": "디지털 서명(가능한 경우)",
    }
    vuln = []
    for k, desc in keys.items():
        val = reg_value(base, k)
        evidence[k] = val
        if val is None or val.strip() != "1":
            vuln.append(f"{desc}: 미사용")

    evidence["vuln_reasons"] = vuln
    status = "양호" if not vuln else "취약"
    return result_dict(code, name, imp, status, evidence, purpose)


# ══════════════════════════════════════════════
#  W-61  파일 및 디렉토리 보호
# ══════════════════════════════════════════════
def check_w61():
    code, name, imp = "W-61", "파일 및 디렉토리 보호", "중"
    purpose = "NTFS 파일 시스템 사용 여부 점검"
    evidence = {}

    rc, out, _ = run_ps(
        "Get-Volume | Where-Object { $_.DriveLetter } | "
        "Select-Object DriveLetter, FileSystemType, Size | "
        "ConvertTo-Json -Compress"
    )
    fat_volumes = []
    if rc == 0 and out:
        try:
            volumes = json.loads(out)
            if isinstance(volumes, dict):
                volumes = [volumes]
            evidence["volumes"] = volumes
            fat_volumes = [v for v in volumes
                           if v.get("FileSystemType", "").upper() not in ("NTFS", "REFS", "")]
        except json.JSONDecodeError:
            evidence["raw"] = out[:500]

    evidence["non_ntfs_volumes"] = fat_volumes
    status = "양호" if not fat_volumes else "취약"
    return result_dict(code, name, imp, status, evidence, purpose)


# ══════════════════════════════════════════════
#  W-62  시작 프로그램 목록 분석
# ══════════════════════════════════════════════
def check_w62():
    code, name, imp = "W-62", "시작 프로그램 목록 분석", "중"
    purpose = "시작 프로그램 목록 내 불필요한/의심스러운 항목 점검"
    evidence = {}

    rc, out, _ = run_ps(
        "Get-CimInstance Win32_StartupCommand | "
        "Select-Object Name, Command, Location | "
        "ConvertTo-Json -Compress"
    )
    if rc == 0 and out:
        try:
            items = json.loads(out)
            if isinstance(items, dict):
                items = [items]
            evidence["startup_items"] = items
        except json.JSONDecodeError:
            evidence["raw"] = out[:1000]
    evidence["note"] = "시작 프로그램 목록의 적정성은 수동 확인 필요"
    status = "수동점검필요"
    return result_dict(code, name, imp, status, evidence, purpose)


# ══════════════════════════════════════════════
#  W-63  도메인 컨트롤러-사용자의 시간 동기화
# ══════════════════════════════════════════════
def check_w63():
    code, name, imp = "W-63", "도메인 컨트롤러-사용자의 시간 동기화", "중"
    purpose = "Kerberos 최대 시계 동기화 허용 오차가 5분 이하인지 점검"
    evidence = {}

    cfg = get_secedit_cfg()
    val = cfg.get("MaxClockSkew", None)
    evidence["MaxClockSkew"] = val

    if val is None:
        status = "수동점검필요"
        evidence["note"] = "Kerberos 정책 미설정 또는 비도메인 환경"
    else:
        try:
            status = "양호" if int(val) <= 5 else "취약"
        except ValueError:
            status = "수동점검필요"
    return result_dict(code, name, imp, status, evidence, purpose)


# ══════════════════════════════════════════════
#  W-64  윈도우 방화벽 설정
# ══════════════════════════════════════════════
def check_w64():
    code, name, imp = "W-64", "윈도우 방화벽 설정", "중"
    purpose = "Windows 방화벽 활성화 여부 점검"
    evidence = {}

    rc, out, _ = run_ps(
        "Get-NetFirewallProfile | Select-Object Name, Enabled | "
        "ConvertTo-Json -Compress"
    )
    if rc == 0 and out:
        try:
            profiles = json.loads(out)
            if isinstance(profiles, dict):
                profiles = [profiles]
            evidence["firewall_profiles"] = profiles
            disabled = [p for p in profiles if str(p.get("Enabled", "")).lower() != "true"]
            status = "양호" if not disabled else "취약"
            if disabled:
                evidence["disabled_profiles"] = [p.get("Name") for p in disabled]
        except json.JSONDecodeError:
            evidence["raw"] = out[:300]
            status = "수동점검필요"
    else:
        evidence["error"] = "방화벽 정보 조회 실패"
        status = "수동점검필요"
    return result_dict(code, name, imp, status, evidence, purpose)


# ══════════════════════════════════════════════
# MAIN
# ══════════════════════════════════════════════

ALL_CHECKS = [
    check_w01, check_w02, check_w03, check_w04, check_w05,
    check_w06, check_w07, check_w08, check_w09, check_w10,
    check_w11, check_w12, check_w13, check_w14, check_w15,
    check_w16, check_w17, check_w18, check_w19, check_w20,
    check_w21, check_w22, check_w23, check_w24, check_w25,
    check_w26, check_w27, check_w28, check_w29, check_w30,
    check_w31, check_w32, check_w33, check_w34, check_w35,
    check_w36, check_w37, check_w38, check_w39, check_w40,
    check_w41, check_w42, check_w43, check_w44, check_w45,
    check_w46, check_w47, check_w48, check_w49, check_w50,
    check_w51, check_w52, check_w53, check_w54, check_w55,
    check_w56, check_w57, check_w58, check_w59, check_w60,
    check_w61, check_w62, check_w63, check_w64,
]


def main():
    if not is_admin():
        print("[경고] 관리자 권한이 아닙니다. 일부 점검 항목이 정확하지 않을 수 있습니다.", file=sys.stderr)

    print(f"[*] 주요정보통신기반시설 Windows 서버 취약점 자동진단 시작")
    print(f"[*] 호스트명: {platform.node()}")
    print(f"[*] OS: {platform.platform()}")
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

    report = {
        "scan_info": {
            "hostname": platform.node(),
            "os": platform.platform(),
            "scan_time": datetime.datetime.now().isoformat(),
            "total_checks": len(ALL_CHECKS),
        },
        "summary": summary,
        "results": results,
    }

    outfile = f"security_audit_win_{platform.node()}_{datetime.datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
    with open(outfile, "w", encoding="utf-8") as f:
        json.dump(report, f, ensure_ascii=False, indent=2)

    print(f"\n[*] 결과 저장 완료: {outfile}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
