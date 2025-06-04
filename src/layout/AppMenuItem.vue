<script setup lang="ts">
import { useLayout } from '@/layout/composables/layout';
import { onBeforeMount, ref, watch } from 'vue';
import { useRoute } from 'vue-router';

interface MenuItem {
  label: string;
  icon?: string;
  to?: string;
  url?: string;
  command?: (event: { originalEvent: Event; item: MenuItem }) => void;
  disabled?: boolean;
  visible?: boolean;
  class?: string;
  target?: string;
  items?: MenuItem[];
}

interface Props {
  item: MenuItem;
  index?: number;
  root?: boolean;
  parentItemKey?: string | null;
}

const route = useRoute();

const { layoutState, setActiveMenuItem, toggleMenu } = useLayout();

const props = withDefaults(defineProps<Props>(), {
  index: 0,
  root: true,
  parentItemKey: null
});

const isActiveMenu = ref(false);
const itemKey = ref<string | null>(null);

onBeforeMount(() => {
    itemKey.value = props.parentItemKey ? props.parentItemKey + '-' + props.index : String(props.index);

    const activeItem = layoutState.activeMenuItem;

    isActiveMenu.value = activeItem === itemKey.value || activeItem ? activeItem.startsWith(itemKey.value + '-') : false;
});

watch(
    () => layoutState.activeMenuItem,
    (newVal: string | null) => {
        if (newVal && itemKey.value) {
            isActiveMenu.value = newVal === itemKey.value || newVal.startsWith(itemKey.value + '-');
        }
    }
);

function itemClick(event: Event, item: MenuItem): void {
    if (item.disabled) {
        event.preventDefault();
        return;
    }

    if ((item.to || item.url) && (layoutState.staticMenuMobileActive || layoutState.overlayMenuActive)) {
        toggleMenu();
    }

    if (item.command) {
        item.command({ originalEvent: event, item: item });
    }

    const foundItemKey = item.items ? (isActiveMenu.value ? props.parentItemKey : itemKey.value) : itemKey.value;

    if (foundItemKey) {
        setActiveMenuItem(foundItemKey);
    }
}

function checkActiveRoute(item: MenuItem): boolean {
    return route.path === item.to;
}
</script>

<template>
    <li :class="{ 'layout-root-menuitem': root, 'active-menuitem': isActiveMenu }">
        <div v-if="root && item.visible !== false" class="layout-menuitem-root-text">{{ item.label }}</div>
        <a v-if="(!item.to || item.items) && item.visible !== false" :href="item.url" @click="itemClick($event, item)" :class="item.class" :target="item.target" tabindex="0">
            <i :class="item.icon" class="layout-menuitem-icon"></i>
            <span class="layout-menuitem-text">{{ item.label }}</span>
            <i class="pi pi-fw pi-angle-down layout-submenu-toggler" v-if="item.items"></i>
        </a>
        <router-link v-if="item.to && !item.items && item.visible !== false" @click="itemClick($event, item)" :class="[item.class, { 'active-route': checkActiveRoute(item) }]" tabindex="0" :to="item.to">
            <i :class="item.icon" class="layout-menuitem-icon"></i>
            <span class="layout-menuitem-text">{{ item.label }}</span>
            <i class="pi pi-fw pi-angle-down layout-submenu-toggler" v-if="item.items"></i>
        </router-link>
        <Transition v-if="item.items && item.visible !== false" name="layout-submenu">
            <ul v-show="root ? true : isActiveMenu" class="layout-submenu">
                <app-menu-item v-for="(child, i) in item.items" :key="child.label" :index="i" :item="child" :parentItemKey="itemKey" :root="false"></app-menu-item>
            </ul>
        </Transition>
    </li>
</template>

<style lang="scss" scoped></style>
