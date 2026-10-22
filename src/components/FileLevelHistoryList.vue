<script setup>
import { fileLevelHistoryLabels, fileLevelHistoryDescriptions } from '../models/fileLevelHistory.js'
import { formatReviewTime } from '../models/reviewHistory.js'
import { platformDisplayName } from '../models/platform.js'
defineProps({ records: { type: Array, required: true }, platforms: { type: Array, default: () => [] } })
</script>
<template>
  <TransitionGroup name="level-history-row" tag="ol" class="level-history" aria-label="文件等级变更记录" appear>
    <li v-for="(record, index) in records" :key="record.id" class="level-history__item" :style="{ '--row-delay': `${Math.min(index * 60, 300)}ms` }">
      <header class="level-history__header">
        <div class="level-history__file"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9ZM14 3v6h6M8 13h8M8 17h5" /></svg><strong>文件资源 #{{ record.resourceId }}</strong><span>{{ platformDisplayName(platforms, record.sourcePlatform) }}</span></div>
        <time :datetime="record.createdAt">{{ formatReviewTime(record.createdAt) }}</time>
      </header>
      <div class="level-history__change">
        <div class="level-history__level"><span>原等级</span><strong>{{ record.previousLevel ?? '未知' }}</strong></div>
        <svg class="level-history__arrow" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12h16m-6-6 6 6-6 6" /></svg>
        <div class="level-history__level level-history__level--new"><span>目标等级</span><strong>{{ record.newLevel }}</strong></div>
        <div class="level-history__state"><span class="level-history__status" :class="`is-${record.status}`">{{ fileLevelHistoryLabels[record.status] }}</span><small>{{ fileLevelHistoryDescriptions[record.status] }}</small></div>
      </div>
      <p class="level-history__note">{{ record.note || '未填写变更备注' }}</p>
      <footer class="level-history__meta"><span :title="record.reviewer">操作人：{{ record.reviewerName }}</span><span>更新时间：<time :datetime="record.updatedAt">{{ formatReviewTime(record.updatedAt) }}</time></span></footer>
      <div class="level-history__identifiers"><span>来源文件：{{ record.sourceId || '—' }}</span><span v-if="record.resultMessageId">发布回执：{{ record.resultMessageId }}</span></div>
    </li>
  </TransitionGroup>
</template>
<style scoped>
/* 沿用 contract-service-fe 的 FileLevelHistoryList 卡片层次与等级箭头布局。 */
.level-history { position: relative; margin: 0; padding: 22px 26px; list-style: none; }
.level-history__item { margin-bottom: 14px; padding: 20px 22px; border: 1px solid #668b7024; border-radius: 16px; color: #344e40; background: #ffffffc4; box-shadow: 0 4px 16px #314d3b06; }
.level-history__item:last-child { margin-bottom: 0; }
.level-history__header, .level-history__file, .level-history__change, .level-history__meta { display: flex; align-items: center; }
.level-history__header { justify-content: space-between; flex-wrap: wrap; gap: 10px 20px; }
.level-history__file { min-width: 0; gap: 9px; flex-wrap: wrap; color: #83998b; font-size: 11px; }
.level-history__file svg { width: 18px; height: 18px; flex: none; fill: none; stroke: #708e7b; stroke-width: 1.5; stroke-linejoin: round; stroke-linecap: round; }
.level-history__file strong { min-width: 0; color: #4d6858; font-size: 12px; font-weight: 550; overflow-wrap: anywhere; }
.level-history__header time { color: #819286; font-size: 11px; font-variant-numeric: tabular-nums; }
.level-history__change { gap: 22px; margin: 22px 0 18px; }
.level-history__level { display: grid; gap: 7px; min-width: 0; flex: 1; }
.level-history__level > span { color: #819286; font-size: 11px; }
.level-history__level strong { color: #71867a; font-size: 25px; font-weight: 500; font-variant-numeric: tabular-nums; overflow-wrap: anywhere; }
.level-history__level--new strong { color: #3d6b50; }
.level-history__arrow { width: 22px; height: 22px; flex: none; fill: none; stroke: #9bb1a2; stroke-width: 1.5; stroke-linecap: round; stroke-linejoin: round; }
.level-history__state { display: grid; gap: 8px; justify-items: end; margin-left: auto; }
.level-history__status { padding: 6px 10px; border-radius: 8px; background: #e9f3ed; color: #4d7a5e; font-size: 11px; }
.level-history__status.is-prepared { background: #eef0f3; color: #7b8790; }
.level-history__status.is-local_updated { background: #fbf0de; color: #a37a3e; }
.level-history__state small { color: #91a095; font-size: 10px; }
.level-history__note { max-height: 12em; margin: 0; overflow: auto; white-space: pre-wrap; overflow-wrap: anywhere; font-size: 12px; line-height: 1.85; color: #566d5f; scrollbar-width: thin; }
.level-history__meta { justify-content: space-between; flex-wrap: wrap; gap: 8px 16px; margin-top: 16px; padding-top: 13px; border-top: 1px solid #668b7017; color: #819286; font-size: 11px; line-height: 1.6; overflow-wrap: anywhere; }
.level-history__identifiers { display: flex; flex-wrap: wrap; gap: 8px 20px; margin-top: 9px; color: #9aa79f; font-size: 10px; line-height: 1.6; overflow-wrap: anywhere; }
.level-history-row-enter-active { transition: opacity .28s ease var(--row-delay), transform .34s cubic-bezier(.22, 1, .36, 1) var(--row-delay); }
.level-history-row-leave-active { transition: opacity .16s ease; }
.level-history-row-enter-from { opacity: 0; transform: translateX(-18px); }
.level-history-row-leave-to { opacity: 0; }
.level-history-row-move { transition: transform .3s ease; }
@media (max-width: 600px) { .level-history { padding: 16px; } .level-history__item { padding: 16px; } .level-history__change { display: grid; grid-template-columns: minmax(0, 1fr) 22px minmax(0, 1fr); gap: 14px; } .level-history__state { grid-column: 1 / -1; justify-items: start; margin-left: 0; } }
@media (prefers-reduced-motion: reduce) { .level-history-row-enter-active, .level-history-row-leave-active, .level-history-row-move { transition: none; } }
</style>
