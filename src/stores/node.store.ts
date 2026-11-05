import { reactive } from 'vue';

const state = reactive({
  expandedNodeName: null as string | null,

  toggleExpandedNode(name: string): void {
    state.expandedNodeName = state.expandedNodeName === name ? null : name;
  },

  isExpanded(name: string): boolean {
    return state.expandedNodeName === name;
  },
});

export default state;
