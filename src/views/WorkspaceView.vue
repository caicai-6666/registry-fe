<script setup>
import { computed, inject } from 'vue'
import DataCenterPanel from '../components/DataCenterPanel.vue'
import { PLATFORM_DIRECTORY_KEY } from '../services/platformDirectory.js'
import { usePlatformSelection } from '../composables/usePlatformSelection.js'

defineEmits(['initial-ready'])
const props = defineProps({ active: { type: Boolean, default: true } })
const platformSnapshot = inject(PLATFORM_DIRECTORY_KEY)
const platformSelection = usePlatformSelection(computed(() => platformSnapshot.value.platforms))
</script>

<template>
  <section class="workspace-data-center" aria-label="数据中心">
    <DataCenterPanel :active="props.active" :platform-snapshot="platformSnapshot" :selected-platform-codes="platformSelection.selectedCodes.value" @initial-ready="$emit('initial-ready')" @toggle-platform="platformSelection.toggle" @select-all-platforms="platformSelection.setAll" />
  </section>
</template>

<style scoped>
.workspace-data-center { width: 100%; height: 100%; min-width: 0; min-height: 0; overflow: auto; }
</style>
