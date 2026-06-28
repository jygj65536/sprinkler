#!/usr/bin/env python3
"""
species-db.generated.ts 의 desc 필드에서 -다로 끝나는 문장을 -요 형태로 변환
Usage: python3 scripts/fix-desc-endings.py
"""
import re

# ── 한국어 음절 분해/합성 ──────────────────────────────────────────────────
def decompose(ch):
    v = ord(ch) - 0xAC00
    if not (0 <= v <= 0x2C43):
        return None, None, None
    return v // 28 // 21, (v // 28) % 21, v % 28

def compose(i, v, f=0):
    return chr(i * 21 * 28 + v * 28 + f + 0xAC00)

# 양성 모음 (ㅏ ㅑ ㅗ ㅘ ㅙ ㅛ) → 아요; 나머지 → 어요
BRIGHT = {0, 2, 8, 9, 10, 12}

# ── 단일 음절 변환 ────────────────────────────────────────────────────────
def convert_one(kr_char, prev_char=None):
    """
    kr_char + '다' → 요체 어미 반환 (마침표 미포함)
    반환값이 kr_char를 대체하는 전체 어미.
    단, '는' 케이스는 kr_char 자체를 제거하고 앞 음절에 어미를 붙이므로
    (prev_char + ao_suffix)를 반환.
    """
    ch = kr_char
    if not (0xAC00 <= ord(ch) <= 0xD7A3):
        return ch + '다'  # 한국어 아님, 변환 안 함

    i, v, f = decompose(ch)

    # 직접 매핑 (가장 빈출)
    if ch == '이': return '이에요'
    if ch == '하': return '해요'
    if ch == '되': return '돼요'
    if ch == '있': return '있어요'
    if ch == '없': return '없어요'

    # 는 받침 — 자음 어간 동사의 는다 형태 (심는다, 먹는다)
    # '는' 자체도 ㄴ 받침을 갖기 때문에 f==4 브랜치보다 먼저 처리
    if ch == '는':
        if prev_char and (0xAC00 <= ord(prev_char) <= 0xD7A3):
            _, sv, _ = decompose(prev_char)
            return '아요' if sv in BRIGHT else '어요'
        return '어요'  # fallback

    # ㄴ 받침 — 모음 어간 동사/형용사의 ㄴ다 형태 (자란다, 어울린다, 한다, 된다 등)
    if f == 4:
        if ch == '된': return '돼요'
        if ch == '한': return '해요'
        stem = compose(i, v, 0)   # ㄴ 받침 제거
        if v == 0:  return stem + '요'              # ㅏ: 동모음 탈락 (자라요)
        if v == 8:  return compose(i, 9,  0) + '요' # ㅗ→ㅘ (봐요)
        if v == 13: return compose(i, 14, 0) + '요' # ㅜ→ㅝ (줘요, 뤄요)
        if v == 18: return stem + '어요'             # ㅡ
        if v == 20: return compose(i, 6,  0) + '요' # ㅣ→ㅕ (어울려요, 보여요)
        return stem + ('요' if v in BRIGHT else '어요')

    # 는 받침 — 자음 어간 동사의 는다 형태 (심는다, 먹는다)
    # match 전체가 '는다.' → '는' 을 제거하고 어간 어미 반환
    if ch == '는':
        if prev_char and (0xAC00 <= ord(prev_char) <= 0xD7A3):
            _, sv, _ = decompose(prev_char)
            return '아요' if sv in BRIGHT else '어요'
        return '어요'  # fallback

    # ㅂ 불규칙 (아름답다→아름다워요, 쉽다→쉬워요)
    if f == 17:
        return compose(i, v, 0) + '워요'

    # ㅡ 모음 (크다→커요, 나쁘다→나빠요)
    if v == 18 and f == 0:
        pv = None
        if prev_char and (0xAC00 <= ord(prev_char) <= 0xD7A3):
            _, pv, _ = decompose(prev_char)
        new_v = 0 if (pv is not None and pv in BRIGHT) else 4
        return compose(i, new_v, 0) + '요'

    # ㅎ 받침 — 이렇다→이래요(ㅎ불규칙), 좋다→좋아요(일반)
    if f == 27:
        if v == 4:  # ㅓ+ㅎ 불규칙 (이렇다, 그렇다, 어떻다)
            return compose(i, 1, 0) + '요'  # ㅓ→ㅐ
        return ch + ('아요' if v in BRIGHT else '어요')

    # 받침 없음 — 직접 모음 어미
    if f == 0:
        if v == 0:  return ch + '요'              # ㅏ 동모음 탈락 (나요)
        if v == 8:  return compose(i, 9,  0) + '요' # ㅗ→ㅘ
        if v == 13: return compose(i, 14, 0) + '요' # ㅜ→ㅝ
        if v == 18:
            pv = None
            if prev_char and (0xAC00 <= ord(prev_char) <= 0xD7A3):
                _, pv, _ = decompose(prev_char)
            new_v = 0 if (pv is not None and pv in BRIGHT) else 4
            return compose(i, new_v, 0) + '요'
        if v == 20: return compose(i, 6, 0) + '요'  # ㅣ→ㅕ
        return ch + ('아요' if v in BRIGHT else '어요')

    # 일반 (받침 있음)
    return ch + ('아요' if v in BRIGHT else '어요')


# ── 텍스트 내 전체 변환 ───────────────────────────────────────────────────
def fix_da_in_text(text):
    """텍스트 내 모든 ~다. 와 말미 ~다 를 요체로 변환"""

    def repl(m):
        pos = m.start()
        kr_char = m.group(0)[0]       # 다. 바로 앞 한국어 음절
        prev = text[pos - 1] if pos > 0 else None

        new_ending = convert_one(kr_char, prev)
        # '는' 케이스: convert_one 이 '아요'/'어요'만 반환 → kr_char 제거 효과
        if kr_char == '는':
            return new_ending + '.'  # '는다.' → '아/어요.'
        return new_ending + '.'

    result = re.sub(r'[가-힣]다\.', repl, text)

    # 말미 '~다' (마침표 없음)
    if result.endswith('다') and len(result) >= 2:
        ch = result[-2]
        if 0xAC00 <= ord(ch) <= 0xD7A3:
            prev = result[-3] if len(result) >= 3 else None
            new_end = convert_one(ch, prev)
            if ch == '는':
                result = result[:-2] + new_end
            else:
                result = result[:-2] + new_end

    return result


# ── 파일 처리 ─────────────────────────────────────────────────────────────
def process_file(path):
    content = open(path, encoding='utf-8').read()

    changed = 0

    def replace_desc(m):
        nonlocal changed
        raw = m.group(1)  # JSON 문자열 내용 (이스케이프 포함)
        # \r\n 이스케이프를 실제 줄바꿈으로 디코드
        decoded = raw.replace('\\r\\n', '\r\n').replace('\\r', '\r').replace('\\n', '\n')
        converted = fix_da_in_text(decoded)
        if converted != decoded:
            changed += 1
        # 다시 이스케이프
        re_enc = converted.replace('\r\n', '\\r\\n').replace('\r', '\\r').replace('\n', '\\n')
        return f'desc: "{re_enc}"'

    new_content = re.sub(r'desc: "((?:[^"\\]|\\.)*)"', replace_desc, content)

    open(path, 'w', encoding='utf-8').write(new_content)
    print(f'변환 완료: {changed}건 수정 ({path})')


if __name__ == '__main__':
    import os
    path = os.path.join(os.path.dirname(__file__), '../src/species-db.generated.ts')
    process_file(os.path.abspath(path))
