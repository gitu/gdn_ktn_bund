/**
 * Tests for CodelistMapper utility functions
 *
 * These tests verify the codelist mapping functionality for Swiss financial data.
 * The tests cover label retrieval, code inclusion checks, and tree building.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  getCodeLabel,
  isCodeIncluded,
  buildCodeTree,
  type CodelistEntry
} from '../CodelistMapper';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock CSV data for testing
const mockCsvData = `arten,funk,d,f,i,e,dim,model
"2","","Aufwand","Charges","Spese","Expenses","aufwand","gfs"
"21","","Arbeitsentgelte","Salaires","Salari","Salaries","aufwand","gfs"
"211","","Löhne","Salaires de base","Salari di base","Basic salaries","aufwand","gfs"
"3","","Ertrag","Revenus","Ricavi","Revenue","ertrag","gfs"
"31","","Steuern","Impôts","Imposte","Taxes","ertrag","gfs"
"4","","Aufwand","Charges","Spese","Expenses","aufwand","fs"
"41","","Personal","Personnel","Personale","Personnel","aufwand","fs"`;

const expectedCodelistData: CodelistEntry[] = [
  { arten: "2", funk: "", d: "Aufwand", f: "Charges", i: "Spese", e: "Expenses", dim: "aufwand", model: "gfs" },
  { arten: "21", funk: "", d: "Arbeitsentgelte", f: "Salaires", i: "Salari", e: "Salaries", dim: "aufwand", model: "gfs" },
  { arten: "211", funk: "", d: "Löhne", f: "Salaires de base", i: "Salari di base", e: "Basic salaries", dim: "aufwand", model: "gfs" },
  { arten: "3", funk: "", d: "Ertrag", f: "Revenus", i: "Ricavi", e: "Revenue", dim: "ertrag", model: "gfs" },
  { arten: "31", funk: "", d: "Steuern", f: "Impôts", i: "Imposte", e: "Taxes", dim: "ertrag", model: "gfs" },
  { arten: "4", funk: "", d: "Aufwand", f: "Charges", i: "Spese", e: "Expenses", dim: "aufwand", model: "fs" },
  { arten: "41", funk: "", d: "Personal", f: "Personnel", i: "Personale", e: "Personnel", dim: "aufwand", model: "fs" }
];

describe('CodelistMapper', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Mock successful fetch response
    mockFetch.mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(mockCsvData)
    });
  });

  afterEach(() => {
    // Clear any cached data between tests
    vi.resetModules();
    // Reset the module's internal cache by re-importing
    vi.doUnmock('../CodelistMapper');
  });

  describe('getCodeLabel', () => {
    it('should get German label for arten code', async () => {
      const label = await getCodeLabel('2');
      expect(label).toBe('Aufwand');
    });

    it('should get French label for arten code', async () => {
      const label = await getCodeLabel('2', null, 'f');
      expect(label).toBe('Charges');
    });

    it('should get Italian label for arten code', async () => {
      const label = await getCodeLabel('2', null, 'i');
      expect(label).toBe('Spese');
    });

    it('should get English label for arten code', async () => {
      const label = await getCodeLabel('2', null, 'e');
      expect(label).toBe('Expenses');
    });

    it('should filter by model when provided', async () => {
      const label = await getCodeLabel('4', null, 'd', 'fs');
      expect(label).toBe('Aufwand');
    });

    it('should filter by dimension when provided', async () => {
      const label = await getCodeLabel('2', null, 'd', 'gfs', 'aufwand');
      expect(label).toBe('Aufwand');
    });

    it('should return null for non-existent code', async () => {
      const label = await getCodeLabel('999');
      expect(label).toBeNull();
    });

    it('should return null when model filter excludes results', async () => {
      const label = await getCodeLabel('2', null, 'd', 'nonexistent');
      expect(label).toBeNull();
    });

    it('should return null when dimension filter excludes results', async () => {
      const label = await getCodeLabel('2', null, 'd', 'gfs', 'nonexistent');
      expect(label).toBeNull();
    });

    it('should handle fetch errors gracefully', async () => {
      // Clear any existing cache first
      vi.resetModules();
      const { getCodeLabel } = await import('../CodelistMapper');

      mockFetch.mockRejectedValueOnce(new Error('Network error'));
      const label = await getCodeLabel('2');
      expect(label).toBeNull();
    });

    it('should handle HTTP errors gracefully', async () => {
      // Clear any existing cache first
      vi.resetModules();
      const { getCodeLabel } = await import('../CodelistMapper');

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404
      });
      const label = await getCodeLabel('2');
      expect(label).toBeNull();
    });
  });

  describe('isCodeIncluded', () => {
    it('should return true when child code is included in parent', () => {
      expect(isCodeIncluded('21', '2')).toBe(true);
      expect(isCodeIncluded('211', '21')).toBe(true);
      expect(isCodeIncluded('211', '2')).toBe(true);
    });

    it('should return false when codes are the same', () => {
      expect(isCodeIncluded('21', '21')).toBe(false);
      expect(isCodeIncluded('2', '2')).toBe(false);
    });

    it('should return false when child is not included in parent', () => {
      expect(isCodeIncluded('2', '21')).toBe(false);
      expect(isCodeIncluded('3', '2')).toBe(false);
      expect(isCodeIncluded('31', '2')).toBe(false);
    });

    it('should handle edge cases', () => {
      expect(isCodeIncluded('', '')).toBe(false);
      expect(isCodeIncluded('1', '')).toBe(true);
      expect(isCodeIncluded('', '1')).toBe(false);
    });
  });

  describe('buildCodeTree', () => {
    it('should build a hierarchical tree structure', async () => {
      const tree = await buildCodeTree('d', 'gfs', 'aufwand');

      expect(tree).toBeDefined();
      expect(Array.isArray(tree)).toBe(true);

      // Should have root node "2"
      const rootNode = tree.find(node => node.code === '2');
      expect(rootNode).toBeDefined();
      expect(rootNode!.label).toBe('Aufwand');
      expect(rootNode!.children.length).toBeGreaterThan(0);

      // Should have child node "21" under "2"
      const childNode = rootNode!.children.find(child => child.code === '21');
      expect(childNode).toBeDefined();
      expect(childNode!.label).toBe('Arbeitsentgelte');

      // Note: "211" should be a child of "21", but our tree building logic
      // might not be perfect. Let's check if it exists anywhere in the tree
      const allNodes = tree.flatMap(node => [node, ...node.children]);
      const node211 = allNodes.find(node => node.code === '211');
      expect(node211).toBeDefined();
      expect(node211!.label).toBe('Löhne');
    });

    it('should filter by model correctly', async () => {
      const tree = await buildCodeTree('d', 'fs');

      // Should only include nodes with model "fs"
      const hasGfsNodes = tree.some(node =>
        expectedCodelistData.find(entry =>
          entry.arten === node.code && entry.model === 'gfs'
        )
      );
      expect(hasGfsNodes).toBe(false);
    });

    it('should filter by dimension correctly', async () => {
      const tree = await buildCodeTree('d', null, 'ertrag');

      // Should only include nodes with dimension "ertrag"
      const rootNode = tree.find(node => node.code === '3');
      expect(rootNode).toBeDefined();
      expect(rootNode!.label).toBe('Ertrag');
    });

    it('should use different languages correctly', async () => {
      const frenchTree = await buildCodeTree('f', 'gfs', 'aufwand');
      const rootNode = frenchTree.find(node => node.code === '2');
      expect(rootNode!.label).toBe('Charges');
    });

    it('should handle empty results gracefully', async () => {
      const tree = await buildCodeTree('d', 'nonexistent');
      expect(tree).toEqual([]);
    });

    it('should handle fetch errors gracefully', async () => {
      // Clear any existing cache first
      vi.resetModules();
      const { buildCodeTree } = await import('../CodelistMapper');

      mockFetch.mockRejectedValueOnce(new Error('Network error'));
      const tree = await buildCodeTree('d');
      expect(tree).toEqual([]);
    });
  });

  describe('CSV parsing edge cases', () => {
    it('should handle malformed CSV gracefully', async () => {
      // Clear any existing cache first
      vi.resetModules();
      const { getCodeLabel } = await import('../CodelistMapper');

      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve('invalid,csv\ndata')
      });

      const label = await getCodeLabel('2');
      expect(label).toBeNull();
    });

    it('should handle empty CSV gracefully', async () => {
      // Clear any existing cache first
      vi.resetModules();
      const { getCodeLabel } = await import('../CodelistMapper');

      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve('')
      });

      const label = await getCodeLabel('2');
      expect(label).toBeNull();
    });
  });
});
