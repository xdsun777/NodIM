<template>
    <header class="flex flex-col gap-2 p-4 sm:hidden pt-safe">
        <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
                <slot v-if="$slots.leftIcon" name="leftIcon"></slot>
                <h1 v-if="!$slots.title" class="text-xl font-bold">Nodim</h1>
                <slot v-else name="title"></slot>
            </div>

            <slot v-if="$slots.rightIcon" name="rightIcon"></slot>
        </div>
        <slot v-if="$slots.search" name="search"></slot>
    </header>

</template>
<script setup lang="ts">

</script>