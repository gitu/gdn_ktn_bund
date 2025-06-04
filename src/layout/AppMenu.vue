<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

import AppMenuItem from './AppMenuItem.vue';

interface MenuItem {
  label: string;
  icon?: string;
  to?: string;
  separator?: boolean;
  items?: MenuItem[];
}

const { t } = useI18n();

const model = computed<MenuItem[]>(() => [
    {
        label: t('navigation.home'),
        items: [{ label: t('navigation.home'), icon: 'pi pi-fw pi-home', to: '/' }]
    },
    {
        label: t('navigation.tools'),
        items: [
            { label: t('navigation.financialComparison'), icon: 'pi pi-fw pi-chart-line', to: '/financial-comparison' },
        ]
    },
    {
        label: t('navigation.about'),
        items: [{ label: t('navigation.about'), icon: 'pi pi-fw pi-info-circle', to: '/about' }]
    }
]);
</script>

<template>
    <ul class="layout-menu">
        <template v-for="(item, i) in model" :key="item">
            <app-menu-item v-if="!item.separator" :item="item" :index="i"></app-menu-item>
            <li v-if="item.separator" class="menu-separator"></li>
        </template>
    </ul>
</template>

<style lang="scss" scoped></style>
