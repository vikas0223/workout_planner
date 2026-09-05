/**
 * Phase 2E: PWA Manifest Validation Tests
 */

import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

const PUBLIC_DIR = path.resolve(__dirname, '../public');

describe('Phase 2E: Web App Manifest Validation', () => {
  const manifestPath = path.join(PUBLIC_DIR, 'manifest.webmanifest');

  it('manifest file exists and is valid JSON', () => {
    expect(fs.existsSync(manifestPath)).toBe(true);
    const content = fs.readFileSync(manifestPath, 'utf-8');
    const manifest = JSON.parse(content);
    expect(manifest).toBeDefined();
  });

  it('contains all required PWA fields', () => {
    const content = fs.readFileSync(manifestPath, 'utf-8');
    const manifest = JSON.parse(content);

    expect(manifest.name).toBe('replyf');
    expect(manifest.short_name).toBe('replyf');
    expect(manifest.start_url).toBe('/');
    expect(manifest.scope).toBe('/');
    expect(manifest.display).toBe('standalone');
    expect(manifest.theme_color).toBeDefined();
    expect(manifest.background_color).toBeDefined();
    expect(manifest.description).toBeDefined();
  });

  it('display mode is standalone', () => {
    const content = fs.readFileSync(manifestPath, 'utf-8');
    const manifest = JSON.parse(content);
    expect(manifest.display).toBe('standalone');
  });

  it('declares at least 3 icons with correct sizes', () => {
    const content = fs.readFileSync(manifestPath, 'utf-8');
    const manifest = JSON.parse(content);

    expect(Array.isArray(manifest.icons)).toBe(true);
    expect(manifest.icons.length).toBeGreaterThanOrEqual(3);

    const sizes = manifest.icons.map((i: any) => i.sizes);
    expect(sizes).toContain('192x192');
    expect(sizes).toContain('512x512');
  });

  it('includes a maskable icon', () => {
    const content = fs.readFileSync(manifestPath, 'utf-8');
    const manifest = JSON.parse(content);

    const maskable = manifest.icons.filter((i: any) => i.purpose === 'maskable');
    expect(maskable.length).toBeGreaterThanOrEqual(1);
  });

  it('all referenced icon files exist on disk', () => {
    const content = fs.readFileSync(manifestPath, 'utf-8');
    const manifest = JSON.parse(content);

    for (const icon of manifest.icons) {
      const iconPath = path.join(PUBLIC_DIR, icon.src);
      expect(fs.existsSync(iconPath), `Icon missing: ${icon.src}`).toBe(true);
    }
  });

  it('theme and background colors are valid hex values', () => {
    const content = fs.readFileSync(manifestPath, 'utf-8');
    const manifest = JSON.parse(content);

    const hexRegex = /^#[0-9a-fA-F]{6}$/;
    expect(hexRegex.test(manifest.theme_color)).toBe(true);
    expect(hexRegex.test(manifest.background_color)).toBe(true);
  });
});
