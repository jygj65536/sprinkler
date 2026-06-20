/**
 * 정적 파일 기반 체크리스트 검증
 *
 * [보안 및 안정성]
 *   - eval() / new Function() 미사용 (외부 코드 실행 금지)
 *   - SSR 미사용 (CSR/SSG만 허용)
 *   - WebSocket 미사용 또는 wss:// 전용
 *
 * [서비스 이용 동작]
 *   - 라이트 모드만 구현 (prefers-color-scheme: dark 없음)
 *   - 제스처 확대/축소 비활성화 (user-scalable=no)
 *
 * [화면 제어]
 *   - Safe Area 적용 (viewport-fit=cover)
 */
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'fs';
import { join, resolve } from 'path';

const ROOT = resolve(__dirname, '../../');
const SRC  = join(ROOT, 'src');

function allSourceFiles(dir: string): string[] {
  const results: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory() && entry !== '__tests__' && entry !== 'node_modules') {
      results.push(...allSourceFiles(full));
    } else if (/\.(ts|tsx|js|jsx|css)$/.test(entry)) {
      results.push(full);
    }
  }
  return results;
}

const srcFiles = allSourceFiles(SRC);
const allSrcContent = srcFiles.map(f => readFileSync(f, 'utf-8')).join('\n');
const indexHtml = readFileSync(join(ROOT, 'index.html'), 'utf-8');
const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf-8'));

// ─── 보안 ───────────────────────────────
describe('[보안] 외부 코드 실행 금지', () => {
  it('eval() 호출 없음', () => {
    expect(allSrcContent).not.toMatch(/\beval\s*\(/);
  });

  it('new Function() 호출 없음', () => {
    expect(allSrcContent).not.toMatch(/new\s+Function\s*\(/);
  });
});

describe('[보안] SSR 미사용 (CSR 전용)', () => {
  const ssrDeps = ['next', 'nuxt', 'remix', '@remix-run', 'sveltekit', 'astro'];

  it('SSR 프레임워크 dependency 없음', () => {
    const allDeps = Object.keys({
      ...pkg.dependencies,
      ...pkg.devDependencies,
    });
    const found = allDeps.filter(d => ssrDeps.some(s => d === s || d.startsWith(s + '/')));
    expect(found).toHaveLength(0);
  });

  it('소스 코드에 서버 전용 API(fs.readFile 등) 없음', () => {
    // Node.js fs 모듈을 런타임에 사용하면 SSR 의심
    expect(allSrcContent).not.toMatch(/require\s*\(\s*['"]fs['"]\s*\)/);
  });
});

describe('[보안] WebSocket: wss:// 전용', () => {
  it('ws:// (비암호화) WebSocket 연결 없음', () => {
    expect(allSrcContent).not.toMatch(/new\s+WebSocket\s*\(\s*['"]ws:\/\//);
  });
});

// ─── 서비스 이용 동작 ────────────────────
describe('[서비스 이용 동작] 라이트 모드 전용', () => {
  const cssFiles = srcFiles.filter(f => f.endsWith('.css'));

  it('CSS에 prefers-color-scheme: dark 없음', () => {
    const cssContent = cssFiles.map(f => readFileSync(f, 'utf-8')).join('\n');
    expect(cssContent).not.toMatch(/prefers-color-scheme\s*:\s*dark/);
  });
});

describe('[서비스 이용 동작] 제스처 확대/축소 비활성화', () => {
  it('viewport에 user-scalable=no 설정', () => {
    expect(indexHtml).toMatch(/user-scalable\s*=\s*no/);
  });

  it('viewport에 maximum-scale=1 설정', () => {
    expect(indexHtml).toMatch(/maximum-scale\s*=\s*1/);
  });
});

// ─── Safe Area ───────────────────────────
describe('[화면 제어] Safe Area', () => {
  it('index.html: viewport-fit=cover 설정', () => {
    expect(indexHtml).toMatch(/viewport-fit\s*=\s*cover/);
  });

  it('CSS에 env(safe-area-inset 사용', () => {
    const cssContent = srcFiles
      .filter(f => f.endsWith('.css'))
      .map(f => readFileSync(f, 'utf-8')).join('\n');
    expect(cssContent).toMatch(/env\s*\(\s*safe-area-inset/);
  });

  it('TSX에서 safe-area CSS 변수 참조', () => {
    const tsxContent = srcFiles
      .filter(f => f.endsWith('.tsx') || f.endsWith('.ts'))
      .map(f => readFileSync(f, 'utf-8')).join('\n');
    expect(tsxContent).toMatch(/safe-area|safe-top|safe-bottom/);
  });
});

// ─── AIT 설정 ────────────────────────────
describe('[AIT] 빌드 환경', () => {
  it('index.html lang="ko" 설정', () => {
    expect(indexHtml).toMatch(/lang\s*=\s*["']ko["']/);
  });

  it('@apps-in-toss/web-framework SDK 2.x 사용', () => {
    const ver: string = pkg.dependencies['@apps-in-toss/web-framework'] ?? '';
    expect(ver).toMatch(/^\^?2\./);
  });
});
