<template>
  <div class="multiselect" :class="{ 'multiselect--active': isOpen }" ref="root">
    <div class="multiselect__tags" @mousedown.prevent="open">
      <input
        v-if="isOpen"
        ref="searchInput"
        class="multiselect__input"
        v-model="search"
        :placeholder="placeholder"
        @keydown.down.prevent="movePointer(1)"
        @keydown.up.prevent="movePointer(-1)"
        @keydown.enter.prevent="selectPointed"
        @keydown.esc.prevent="close"
      >
      <span v-else class="multiselect__single">
        {{ selectedLabel || placeholder }}
      </span>
      <span class="multiselect__select" @mousedown.stop.prevent="toggle"></span>
    </div>

    <transition name="multiselect">
      <div v-if="isOpen" class="multiselect__content-wrapper">
        <ul class="multiselect__content">
          <template v-if="filteredGroups.length">
            <template v-for="group in filteredGroups" :key="group.groupLabel">
              <li class="multiselect__element">
                <span class="multiselect__option multiselect__option--disabled">
                  {{ group.groupLabel }}
                </span>
              </li>
              <li
                v-for="option in group.items"
                :key="option.code"
                class="multiselect__element"
                @mouseenter="pointer = flatOptions.indexOf(option)"
                @mousedown.prevent="select(option)"
              >
                <span
                  class="multiselect__option"
                  :class="{
                    'multiselect__option--highlight': flatOptions[pointer] === option,
                    'multiselect__option--selected': isSelected(option)
                  }"
                >
                  <slot name="option" :option="option">{{ option.name }}</slot>
                </span>
              </li>
            </template>
          </template>
          <li v-else class="multiselect__element">
            <span class="multiselect__option multiselect__option--disabled">
              <slot name="noResult">Not found</slot>
            </span>
          </li>
        </ul>
      </div>
    </transition>
  </div>
</template>

<script>
  export default {
    props: {
      modelValue: { type: Object, default: () => ({}) },
      options: { type: Array, default: () => [] },
      customLabel: { type: Function, default: option => option.name },
      placeholder: { type: String, default: '' },
      groupLabel: { type: String, default: 'groupLabel' },
      groupValues: { type: String, default: 'items' }
    },

    emits: ['update:modelValue', 'open', 'close'],

    data() {
      return {
        isOpen: false,
        search: '',
        pointer: 0
      };
    },

    computed: {
      selectedLabel() {
        return this.modelValue && this.modelValue.code
          ? this.customLabel(this.modelValue)
          : '';
      },

      filteredGroups() {
        const query = this.search.trim().toLowerCase();

        return this.options
          .map(group => {
            const items = (group[this.groupValues] || [])
              .filter(Boolean)
              .filter(option => {
                if (!query) {
                  return true;
                }

                return this.customLabel(option).toLowerCase().includes(query);
              });

            return {
              groupLabel: group[this.groupLabel],
              items
            };
          })
          .filter(group => group.items.length);
      },

      flatOptions() {
        return this.filteredGroups.flatMap(group => group.items);
      }
    },

    watch: {
      search() {
        this.pointer = 0;
      }
    },

    mounted() {
      document.addEventListener('mousedown', this.handleDocumentMouseDown);
    },

    beforeUnmount() {
      document.removeEventListener('mousedown', this.handleDocumentMouseDown);
    },

    methods: {
      open() {
        if (this.isOpen) {
          return;
        }

        this.isOpen = true;
        this.search = '';
        this.pointer = Math.max(0, this.flatOptions.findIndex(this.isSelected));
        this.$emit('open');

        this.$nextTick(() => {
          if (this.$refs.searchInput) {
            this.$refs.searchInput.focus();
          }
        });
      },

      close() {
        if (!this.isOpen) {
          return;
        }

        this.isOpen = false;
        this.search = '';
        this.$emit('close');
      },

      toggle() {
        if (this.isOpen) {
          this.close();
        } else {
          this.open();
        }
      },

      select(option) {
        this.$emit('update:modelValue', option);
        this.close();
      },

      selectPointed() {
        const option = this.flatOptions[this.pointer];

        if (option) {
          this.select(option);
        }
      },

      movePointer(delta) {
        const max = this.flatOptions.length - 1;

        if (max < 0) {
          this.pointer = 0;
          return;
        }

        this.pointer = Math.min(max, Math.max(0, this.pointer + delta));
      },

      isSelected(option) {
        return Boolean(
          option &&
          this.modelValue &&
          option.code === this.modelValue.code
        );
      },

      handleDocumentMouseDown(event) {
        if (this.isOpen && !this.$refs.root.contains(event.target)) {
          this.close();
        }
      }
    }
  };
</script>

<style lang="scss">
  .multiselect {
    box-sizing: border-box;
    display: block;
    position: relative;
    width: 100%;
    min-height: 0;
    color: #35495e;

    * {
      box-sizing: border-box;
    }
  }

  .multiselect--active {
    z-index: 6;
  }

  .multiselect__tags {
    position: relative;
    display: block;
    min-height: 24px;
    padding: 2px 26px 0 2px;
    z-index: 2;
    border-radius: 3px;
    border: none;
    background: #fff;
    box-shadow:
      0 0 0 1px rgba(0, 0, 0, 0.1),
      0 1px 2px rgba(0, 0, 0, 0.1);

    .multiselect--active & {
      border-bottom: none;
    }
  }

  .multiselect__input,
  .multiselect__single {
    position: relative;
    display: block;
    width: 100%;
    min-height: 20px;
    margin: 0 0 2px;
    padding: 0 0 0 5px;
    border: none;
    border-radius: 3px;
    outline: none;
    background: #fff;
    color: #35495e;
    cursor: default;
    font-family: inherit;
    font-size: 11px;
    line-height: 20px;
    text-transform: uppercase;
  }

  .multiselect__input:focus {
    cursor: auto;
  }

  .multiselect__single {
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
  }

  .multiselect__select {
    position: absolute;
    display: block;
    width: 26px;
    height: 24px;
    right: 1px;
    top: 1px;
    z-index: 3;
    cursor: default;
    text-align: center;
    transition: transform 0.2s ease;

    &:before {
      content: '';
      position: relative;
      display: inline-block;
      top: 50%;
      border-color: #999 transparent transparent;
      border-style: solid;
      border-width: 5px 5px 0;
    }
  }

  .multiselect--active .multiselect__select {
    transform: rotate(180deg);
  }

  .multiselect-enter-active,
  .multiselect-leave-active {
    transition:
      opacity 0.15s ease,
      transform 0.15s ease;
  }

  .multiselect-enter-from,
  .multiselect-leave-to {
    opacity: 0;
    transform: translateY(-10px);
  }

  .multiselect__content-wrapper {
    position: absolute;
    display: block;
    width: 100%;
    max-height: 240px;
    overflow: auto;
    padding: 4px 0;
    border: none;
    border-radius: 0 0 3px 3px;
    background: #fff;
    z-index: 50;
    box-shadow:
      0 0 0 1px rgba(0, 0, 0, 0.1),
      0 2px 3px rgba(0, 0, 0, 0.1);
  }

  .multiselect__content {
    display: block;
    min-width: 100%;
    padding: 0;
    margin: 0;
    list-style: none;
  }

  .multiselect__element {
    display: block;
  }

  .multiselect__option {
    display: block;
    position: relative;
    min-height: 0;
    padding: 0 8px 0 25px;
    line-height: 30px;
    color: #35495e;
    cursor: default;
    font-size: 11px;
    text-transform: uppercase;
    white-space: nowrap;
    transition:
      background-color 0.1s ease,
      background-image 0.1s ease,
      color 0.1s ease;
  }

  .multiselect__option--highlight {
    background-color: #41b883;
    color: #fff;
  }

  .multiselect__option--selected {
    background: transparent url('data:image/svg+xml;utf8,<?xml version="1.0" ?><svg height="32" id="check" viewBox="0 0 32 32" width="32" xmlns="http://www.w3.org/2000/svg"><path d="M1 14 L5 10 L13 18 L27 4 L31 8 L13 26 z"/></svg>') 8px 50% no-repeat;
    background-size: 12px 12px;
    font-weight: 500;
  }

  .multiselect__option--selected.multiselect__option--highlight {
    background: #41b883 url('data:image/svg+xml;utf8,<?xml version="1.0" ?><svg height="32" id="check" viewBox="0 0 32 32" width="32" xmlns="http://www.w3.org/2000/svg"><path fill="#fff" d="M1 14 L5 10 L13 18 L27 4 L31 8 L13 26 z"/></svg>') 8px 50% no-repeat;
    background-size: 12px 12px;
  }

  .multiselect__option--disabled {
    background: none;
    padding: 0 8px !important;
    line-height: 30px;
    color: #cecece;
    pointer-events: none;

    &:after {
      content: '';
      display: block;
      position: absolute;
      height: 1px;
      left: 0;
      right: 0;
      bottom: 0;
      background: #000;
      opacity: 0.05;
      pointer-events: none;
      z-index: 7;
    }
  }
</style>
