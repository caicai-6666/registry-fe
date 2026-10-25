<script setup>
import { useWorkspacePage } from '../composables/useWorkspacePage.js'
import { computed, inject } from 'vue'
import DataCenterPanel from '../components/DataCenterPanel.vue'
import { PLATFORM_DIRECTORY_KEY } from '../services/platformDirectory.js'
import { usePlatformSelection } from '../composables/usePlatformSelection.js'

defineEmits(['initial-ready'])
const { active, pageRoot } = useWorkspacePage('data-center')
const platformSnapshot = inject(PLATFORM_DIRECTORY_KEY)
const platformSelection = usePlatformSelection(computed(() => platformSnapshot.value.subManagementPlatforms))
</script>

<template>
  <section ref="pageRoot" class="workspace-route-panel" :inert="!active" :aria-hidden="!active">
    <section class="workspace-data-center" aria-label="数据中心">
      <DataCenterPanel :active="active" :platform-snapshot="platformSnapshot" :selected-platform-codes="platformSelection.selectedCodes.value" @initial-ready="$emit('initial-ready')" @toggle-platform="platformSelection.toggle" @select-all-platforms="platformSelection.setAll" />
    </section>
  </section>
</template>

<style scoped>
.workspace-data-center { width: 100%; height: 100%; min-width: 0; min-height: 0; overflow: auto; }
</style>
