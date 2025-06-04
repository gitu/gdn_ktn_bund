import { describe, it, expect } from 'vitest';
import { TreeNodeAdapter, convertToPrimeVue, convertFromPrimeVue } from '../TreeNodeAdapter';
import type { TreeNode } from '../../types/DataStructures';

describe('TreeNodeAdapter', () => {
  const mockTreeNode: TreeNode = {
    code: 'test-001',
    labels: {
      de: 'Test Node German',
      fr: 'Test Node French',
      it: 'Test Node Italian',
      en: 'Test Node English'
    },
    children: [
      {
        code: 'test-001-1',
        labels: {
          de: 'Child Node German',
          fr: 'Child Node French',
          it: 'Child Node Italian',
          en: 'Child Node English'
        },
        children: [],
        level: 1,
        hasValue: true,
        value: 12345
      }
    ],
    level: 0,
    hasValue: false,
    value: null
  };

  describe('TreeNodeAdapter class', () => {
    it('should create adapter with default config', () => {
      const adapter = new TreeNodeAdapter();
      const config = adapter.getConfig();

      expect(config.language).toBe('de');
      expect(config.showIcons).toBe(true);
      expect(config.includeValues).toBe(true);
      expect(config.expandAll).toBe(false);
    });

    it('should create adapter with custom config', () => {
      const adapter = new TreeNodeAdapter({
        language: 'en',
        showIcons: false,
        includeValues: false
      });
      const config = adapter.getConfig();

      expect(config.language).toBe('en');
      expect(config.showIcons).toBe(false);
      expect(config.includeValues).toBe(false);
    });

    it('should convert TreeNode to PrimeVue format', () => {
      const adapter = new TreeNodeAdapter({ language: 'de' });
      const primeVueNode = adapter.toPrimeVueFormat(mockTreeNode);

      expect(primeVueNode.key).toBe('test-001');
      expect(primeVueNode.label).toBe('Test Node German');
      expect(primeVueNode.leaf).toBe(false);
      expect(primeVueNode.children).toHaveLength(1);
      expect(primeVueNode.data?.originalNode).toBe(mockTreeNode);
    });

    it('should include values in label when configured', () => {
      const adapter = new TreeNodeAdapter({
        language: 'de',
        includeValues: true
      });
      const primeVueNode = adapter.toPrimeVueFormat(mockTreeNode);
      const childNode = primeVueNode.children![0];

      expect(childNode.label).toContain('Child Node German');
      expect(childNode.label).toContain('12'); // Check that value is included
      expect(childNode.label).toContain('345'); // Check that value is included
    });

    it('should not include values in label when disabled', () => {
      const adapter = new TreeNodeAdapter({
        language: 'de',
        includeValues: false
      });
      const primeVueNode = adapter.toPrimeVueFormat(mockTreeNode);
      const childNode = primeVueNode.children![0];

      expect(childNode.label).toBe('Child Node German');
      expect(childNode.label).not.toContain('12345'); // Should not contain value
    });

    it('should add icons when enabled', () => {
      const adapter = new TreeNodeAdapter({ showIcons: true });
      const primeVueNode = adapter.toPrimeVueFormat(mockTreeNode);

      expect(primeVueNode.icon).toBe('pi pi-folder');
      expect(primeVueNode.children![0].icon).toBe('pi pi-file');
    });

    it('should not add icons when disabled', () => {
      const adapter = new TreeNodeAdapter({ showIcons: false });
      const primeVueNode = adapter.toPrimeVueFormat(mockTreeNode);

      expect(primeVueNode.icon).toBeUndefined();
    });

    it('should convert PrimeVue format back to TreeNode', () => {
      const adapter = new TreeNodeAdapter();
      const primeVueNode = adapter.toPrimeVueFormat(mockTreeNode);
      const convertedBack = adapter.fromPrimeVueFormat(primeVueNode);

      expect(convertedBack).toEqual(mockTreeNode);
    });

    it('should handle different languages', () => {
      const adapter = new TreeNodeAdapter({ language: 'fr' });
      const primeVueNode = adapter.toPrimeVueFormat(mockTreeNode);

      expect(primeVueNode.label).toBe('Test Node French');
    });

    it('should fallback to German when language not available', () => {
      const nodeWithMissingTranslation: TreeNode = {
        ...mockTreeNode,
        labels: {
          de: 'German Label',
          fr: '',
          it: '',
          en: ''
        }
      };

      const adapter = new TreeNodeAdapter({ language: 'en' });
      const primeVueNode = adapter.toPrimeVueFormat(nodeWithMissingTranslation);

      expect(primeVueNode.label).toBe('German Label');
    });

    it('should convert tree structure', () => {
      const treeStructure = {
        tree: mockTreeNode,
        metadata: { totalNodes: 2 }
      };

      const adapter = new TreeNodeAdapter();
      const primeVueTree = adapter.convertTreeStructure(treeStructure);

      expect(primeVueTree).toHaveLength(1);
      expect(primeVueTree[0].key).toBe('test-001');
    });

    it('should handle selection keys conversion', () => {
      const adapter = new TreeNodeAdapter();
      const selectedCodes = ['test-001', 'test-002'];
      const selectionKeys = adapter.getSelectionKeys(selectedCodes);

      expect(selectionKeys).toEqual({
        'test-001': true,
        'test-002': true
      });

      const extractedCodes = adapter.getSelectedCodes(selectionKeys);
      expect(extractedCodes).toEqual(selectedCodes);
    });
  });

  describe('Convenience functions', () => {
    it('should convert to PrimeVue format', () => {
      const primeVueNode = convertToPrimeVue(mockTreeNode, { language: 'en' });

      expect(primeVueNode.key).toBe('test-001');
      expect(primeVueNode.label).toBe('Test Node English');
    });

    it('should convert from PrimeVue format', () => {
      const primeVueNode = convertToPrimeVue(mockTreeNode);
      const convertedBack = convertFromPrimeVue(primeVueNode);

      expect(convertedBack).toEqual(mockTreeNode);
    });
  });
});
