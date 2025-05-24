// Browser-compatible codelist mapper

// Define the type for the codelist data
export interface CodelistEntry {
  arten: string;
  funk: string;
  d: string;
  f: string;
  i: string;
  e: string;
  dim: string;
  model: string;
}

// Define the type for the tree node
export interface TreeNode {
  code: string;
  funk: string;
  label: string;
  children: TreeNode[];
}

// Cache for the loaded codelist data
let codelistData: CodelistEntry[] | null = null;

/**
 * Load the codelist data from the CSV file
 * @returns Promise that resolves to array of codelist entries
 */
async function loadCodelistData(): Promise<CodelistEntry[]> {
  if (codelistData) {
    return codelistData;
  }

  try {
    const response = await fetch('/data/standardauswertung_codelist.csv');
    if (!response.ok) {
      throw new Error(`Failed to fetch codelist: ${response.status}`);
    }

    const fileContent = await response.text();

    // Parse CSV content
    const lines = fileContent.split('\n');
    const headers = lines[0].split(',').map((header: string) => header.replace(/"/g, '').trim());

    codelistData = lines.slice(1)
      .filter((line: string) => line.trim() !== '')
      .map((line: string) => {
        const values = line.split(',').map((value: string) => value.replace(/"/g, '').trim());
        const entry: Partial<CodelistEntry> = {};

        headers.forEach((header: string, index: number) => {
          if (header && index < values.length) {
            entry[header as keyof CodelistEntry] = values[index];
          }
        });

        return entry as CodelistEntry;
      });

    return codelistData;
  } catch (error) {
    console.error('Error loading codelist data:', error);
    return [];
  }
}

/**
 * Get the label for a given arten and funk in the specified language.
 * This function retrieves the label from the standardauswertung_codelist.csv file
 * based on the provided parameters.
 *
 * @param arten The arten code (e.g., "2", "21", "211")
 * @param funk The funk code (optional, pass null if not needed)
 * @param language The language code: 'd' for German, 'f' for French, 'i' for Italian, 'e' for English
 * @param model The model filter (optional, e.g., "gfs")
 * @param dimension The dimension filter (optional, e.g., "aufwand", "ertrag")
 * @returns The label in the specified language or null if not found
 *
 * @example
 * // Get the German label for arten "2"
 * const label = getCodeLabel("2");
 *
 * @example
 * // Get the French label for arten "21" with model "gfs" and dimension "aufwand"
 * const label = getCodeLabel("21", null, "f", "gfs", "aufwand");
 */
export async function getCodeLabel(
  arten: string,
  funk: string | null = null,
  language: 'd' | 'f' | 'i' | 'e' = 'd',
  model: string | null = null,
  dimension: string | null = null
): Promise<string | null> {
  const data = await loadCodelistData();

  // Filter by the provided parameters
  const filtered = data.filter(entry => {
    // Match arten
    if (entry.arten !== arten) {
      return false;
    }

    // Match funk if provided
    if (funk !== null && entry.funk !== funk) {
      return false;
    }

    // Match model if provided
    if (model !== null && entry.model !== model) {
      return false;
    }

    // Match dimension if provided
    if (dimension !== null && entry.dim !== dimension) {
      return false;
    }

    return true;
  });

  // Return the label in the specified language
  if (filtered.length > 0) {
    return filtered[0][language] || null;
  }

  return null;
}

/**
 * Check if a child code is included in a parent code.
 * This function determines if a code is a child of another code based on hierarchical relationships.
 * For example, "21" is included in "2" because "21" starts with "2".
 *
 * @param childCode The child code to check (e.g., "21", "211")
 * @param parentCode The parent code to check against (e.g., "2")
 * @returns True if the child code is included in the parent code, false otherwise
 *
 * @example
 * // Check if "21" is included in "2"
 * const isIncluded = isCodeIncluded("21", "2"); // Returns true
 *
 * @example
 * // Check if "211" is included in "21"
 * const isIncluded = isCodeIncluded("211", "21"); // Returns true
 *
 * @example
 * // Check if "21" is included in "21" (same code)
 * const isIncluded = isCodeIncluded("21", "21"); // Returns false (same code)
 *
 * @example
 * // Check if "2" is included in "21" (reverse relationship)
 * const isIncluded = isCodeIncluded("2", "21"); // Returns false
 */
export function isCodeIncluded(childCode: string, parentCode: string): boolean {
  // If the codes are the same, they are not in a parent-child relationship
  if (childCode === parentCode) {
    return false;
  }

  // Check if the child code starts with the parent code
  return childCode.startsWith(parentCode);
}

/**
 * Build a hierarchical tree structure based on the codelist data.
 * This function creates a tree where parent-child relationships are established
 * based on the arten codes (e.g., "2" is the parent of "21", which is the parent of "211").
 * The tree can be filtered by model and dimension, and labels are provided in the specified language.
 *
 * @param language The language code: 'd' for German, 'f' for French, 'i' for Italian, 'e' for English
 * @param model The model filter (optional, e.g., "gfs")
 * @param dimension The dimension filter (optional, e.g., "aufwand", "ertrag")
 * @returns A tree structure of TreeNode objects representing the hierarchical relationships
 *
 * @example
 * // Build a tree with German labels for all codes
 * const tree = buildCodeTree("d");
 *
 * @example
 * // Build a tree with French labels for the "gfs" model and "aufwand" dimension
 * const tree = buildCodeTree("f", "gfs", "aufwand");
 *
 * The resulting tree structure looks like:
 * [
 *   {
 *     code: "2",
 *     funk: "",
 *     label: "Aufwand",
 *     children: [
 *       {
 *         code: "21",
 *         funk: "",
 *         label: "Arbeitsentgelte",
 *         children: [...]
 *       },
 *       ...
 *     ]
 *   },
 *   ...
 * ]
 */
export async function buildCodeTree(
  language: 'd' | 'f' | 'i' | 'e' = 'd',
  model: string | null = null,
  dimension: string | null = null
): Promise<TreeNode[]> {
  const data = await loadCodelistData();

  // Filter by the provided parameters
  const filtered = data.filter(entry => {
    // Match model if provided
    if (model !== null && entry.model !== model) {
      return false;
    }

    // Match dimension if provided
    if (dimension !== null && entry.dim !== dimension) {
      return false;
    }

    return true;
  });

  // Sort by arten to ensure parent codes come before child codes
  const sorted = [...filtered].sort((a, b) => {
    if (a.arten.length !== b.arten.length) {
      return a.arten.length - b.arten.length;
    }
    return a.arten.localeCompare(b.arten);
  });

  // Build the tree
  const tree: TreeNode[] = [];
  const nodeMap: Record<string, TreeNode> = {};

  sorted.forEach(entry => {
    const node: TreeNode = {
      code: entry.arten,
      funk: entry.funk,
      label: entry[language] || '',
      children: [],
    };

    nodeMap[entry.arten] = node;

    // Find the parent node
    let parentFound = false;
    for (const potentialParent of Object.keys(nodeMap)) {
      if (isCodeIncluded(entry.arten, potentialParent)) {
        nodeMap[potentialParent].children.push(node);
        parentFound = true;
        break;
      }
    }

    // If no parent found, add to the root of the tree
    if (!parentFound) {
      tree.push(node);
    }
  });

  return tree;
}
