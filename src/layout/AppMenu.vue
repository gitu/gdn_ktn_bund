<script setup lang="ts">
import { ref } from 'vue';

import AppMenuItem from './AppMenuItem.vue';

interface MenuItem {
  label: string;
  icon?: string;
  to?: string;
  separator?: boolean;
  items?: MenuItem[];
}

const model = ref<MenuItem[]>([
    {
        label: 'Home',
        items: [{ label: 'Home', icon: 'pi pi-fw pi-home', to: '/' }]
    },
    {
        label: 'Utilities',
        items: [
            { label: 'Tree Navigator', icon: 'pi pi-fw pi-id-card', to: '/tree-table' },
        ]
    },
    {
        label: 'About',
        items: [{ label: 'About', icon: 'pi pi-fw pi-info-circle', to: '/about' }]
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
