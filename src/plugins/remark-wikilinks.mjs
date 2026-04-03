import { visit, SKIP } from 'unist-util-visit';

/**
 * Remark plugin that converts Obsidian-style [[wikilinks]] to HTML links.
 * Options:
 *   noteMap  — Map<originalName, url>
 *   catMap   — Map<folderName, url>
 */
export default function remarkWikilinks({ noteMap = new Map(), catMap = new Map() } = {}) {
  return (tree) => {
    visit(tree, 'text', (node, index, parent) => {
      if (!node.value.includes('[[')) return;

      // [[Target]] or [[Target|Display Text]]
      const regex = /\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g;
      let match;
      const parts = [];
      let lastIndex = 0;

      while ((match = regex.exec(node.value)) !== null) {
        if (match.index > lastIndex) {
          parts.push({ type: 'text', value: node.value.slice(lastIndex, match.index) });
        }

        const target = match[1].trim();
        const display = match[2] ? match[2].trim() : target;

        // Resolve: check note map first, then category map
        const href = noteMap.get(target) || catMap.get(target);

        if (href) {
          parts.push({
            type: 'link',
            url: href,
            title: null,
            children: [{ type: 'text', value: display }],
          });
        } else {
          // Unresolved — render as plain text (no broken anchor)
          parts.push({ type: 'text', value: display });
        }

        lastIndex = regex.lastIndex;
      }

      if (lastIndex < node.value.length) {
        parts.push({ type: 'text', value: node.value.slice(lastIndex) });
      }

      if (parts.length === 0 || (parts.length === 1 && parts[0].type === 'text' && parts[0].value === node.value)) {
        return; // nothing changed
      }

      parent.children.splice(index, 1, ...parts);
      return [SKIP, index + parts.length];
    });
  };
}
