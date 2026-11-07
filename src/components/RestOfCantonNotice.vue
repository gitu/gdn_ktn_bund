<script setup lang="ts">
// Shown whenever a calculated "rest of canton" column is part of the comparison.
import { computed } from 'vue'
import Message from 'primevue/message'
import { EntitySemanticMapper } from '@/utils/EntitySemanticMapper'
import { parseDatasetId } from '@/utils/PlaceFacts'

const props = defineProps<{ datasets: string[] }>()

const visible = computed(() =>
  props.datasets.some((id) => {
    const parsed = parseDatasetId(id)
    return parsed?.source === 'std' && EntitySemanticMapper.isRestOfCanton(parsed.entity)
  }),
)
</script>

<template>
  <Message
    v-if="visible"
    severity="warn"
    :closable="false"
    class="rest-notice"
    data-testid="rest-notice"
  >
    <div class="notice">
      <strong>{{ $t('restOfCanton.title') }}</strong>
      <p>{{ $t('restOfCanton.text') }}</p>
      <p>{{ $t('restOfCanton.limits') }}</p>
    </div>
  </Message>
</template>

<style scoped>
.rest-notice {
  margin-bottom: 1rem;
}

.notice p {
  margin: 0.35rem 0 0;
  font-size: 0.9rem;
  line-height: 1.5;
}
</style>
