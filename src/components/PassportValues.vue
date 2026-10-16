<script setup>
defineProps({ values: { type: Array, default: null } })
</script>
<template>
  <span class="passport-values"><template v-if="values?.length"><span v-for="(value, index) in values" :key="index">{{ value }}</span></template><span v-else>{{ values === null ? '—' : '无通行证' }}</span></span>
</template>
<style scoped>
.passport-values { display: grid; gap: 4px; min-width: 0; }
.passport-values > span { min-width: 0; overflow-wrap: anywhere; }
</style>
