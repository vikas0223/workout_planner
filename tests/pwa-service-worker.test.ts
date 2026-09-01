/**
 * Phase 2E: Service Worker Validation Tests
 */

import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

const PUBLIC_DIR = path.resolve(__dirname, '../public');

describe('Phase 2E: Service Worker Validation', () => {
  const swPath = path.join(PUBLIC_DIR, 'sw.js');

  it('service worker file exists at public/sw.js', () => {
    expect(fs.existsSync(swPath)).toBe(true);
  });

  it('defines three separate cache categories', () => {
    const content = fs.readFileSync(swPath, 'utf-8');
    expect(content).toContain('workout-planner-shell-v1');
    expect(content).toContain('workout-planner-runtime-v1');
    expect(content).toContain('workout-planner-media-v1');
  });

  it('does NOT call self.skipWaiting() automatically during install', () => {
    const content = fs.readFileSync(swPath, 'utf-8');
    // Extract install event listener body and strip comments
    const installSection = content.split("addEventListener('install'")[1]?.split("addEventListener('activate'")[0] || '';
    const codeWithoutComments = installSection.replace(/\/\/.*/g, '').replace(/\/\*[\s\S]*?\*\//g, '');
    expect(codeWithoutComments).not.toContain('skipWaiting');
  });

  it('supports SKIP_WAITING message for user-controlled updates', () => {
    const content = fs.readFileSync(swPath, 'utf-8');
    expect(content).toContain("event.data.type === 'SKIP_WAITING'");
    expect(content).toContain('self.skipWaiting()');
  });

  it('excludes Supabase URLs from caching', () => {
    const content = fs.readFileSync(swPath, 'utf-8');
    expect(content).toContain('supabase\\.co');
    expect(content).toContain('supabase\\.in');
  });

  it('excludes auth and API endpoints from caching', () => {
    const content = fs.readFileSync(swPath, 'utf-8');
    expect(content).toContain('/\\/api\\//');
    expect(content).toContain('/\\/auth\\//');
    expect(content).toContain('access_token');
    expect(content).toContain('refresh_token');
  });

  it('precaches offline.html as fallback', () => {
    const content = fs.readFileSync(swPath, 'utf-8');
    expect(content).toContain('/offline.html');
  });

  it('offline.html file exists', () => {
    const offlinePath = path.join(PUBLIC_DIR, 'offline.html');
    expect(fs.existsSync(offlinePath)).toBe(true);
  });

  it('cleans up old caches during activate', () => {
    const content = fs.readFileSync(swPath, 'utf-8');
    expect(content).toContain('caches.keys()');
    expect(content).toContain('caches.delete');
    expect(content).toContain('CURRENT_CACHES');
  });
});
