<script setup>
import FileInfoPopover from './FileInfoPopover.vue'
defineProps({ summary: { type: String, default: null }, active: { type: Boolean, default: true } })
</script>
<template>
  <FileInfoPopover title="文件摘要" trigger-label="查看文件摘要" :active="active">{{ summary?.trim() || '暂无摘要' }}</FileInfoPopover>
</template>
