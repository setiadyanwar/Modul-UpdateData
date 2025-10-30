<template>
  <div
    v-if="isOpen"
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
    @click="closeModal"
  >
    <div
      class="bg-white dark:bg-grey-900 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col mx-4"
      @click.stop
    >
      <div
        class="p-4 sm:p-6 border-b border-grey-200 dark:border-grey-700 flex-shrink-0"
      >
        <div class="flex items-start justify-between">
          <div>
            <h2 class="text-xl font-semibold text-text-main">Add new app</h2>
            <p class="text-sm text-grey-500 mt-1">
              Fill in the fields below to create a new app
            </p>
          </div>
          <button
            @click="closeModal"
            class="text-grey-400 hover:text-grey-600 dark:hover:text-grey-300"
          >
            <i class="pi pi-times text-xl"></i>
          </button>
        </div>
      </div>

      <div
        class="overflow-y-auto px-4 sm:px-6 pt-6 sm:pt-8 pb-4 sm:pb-6 space-y-4 sm:space-y-6"
      >
        <div>
          <label class="block text-sm font-medium text-text-main mb-2">
            Logo App
          </label>
          <div class="flex items-center gap-4">
            <label for="logo-upload" class="cursor-pointer">
              <div
                class="w-14 h-14 bg-blue-100 dark:bg-blue-900/50 rounded-full flex items-center justify-center overflow-hidden"
              >
                <img
                  v-if="logoPreview && logoPreview.startsWith('data:')"
                  :src="logoPreview"
                  alt="Logo preview"
                  class="w-full h-full object-cover"
                />
                <span
                  v-else
                  class="text-xl font-bold text-blue-600 dark:text-blue-300"
                >
                  {{ getLogoInitials() }}
                </span>
              </div>
            </label>
            <div>
              <p class="text-sm text-grey-500">Upload the logo application</p>
              <input
                type="file"
                id="logo-upload"
                ref="logoInput"
                accept="image/*"
                @change="handleLogoUpload"
                class="hidden"
              />
            </div>
          </div>
        </div>

        <div>
          <UiInput
            v-model="form.name"
            label="Name App"
            placeholder="Enter the application name"
            required
          />
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          <div>
            <label class="block text-sm font-medium text-text-main mb-2">
              Group name
            </label>
            <div class="relative" ref="groupWrapper">
              <div
                @click="toggleGroupDropdown"
                class="w-full px-3 py-2 border border-grey-300 dark:border-grey-600 rounded-md bg-white dark:bg-grey-800 text-text-main cursor-pointer flex items-center justify-between"
              >
                <div class="flex items-center gap-2 truncate">
                  <i
                    v-if="selectedGroup.icon"
                    :class="selectedGroup.icon"
                    class="text-grey-500"
                  ></i>
                  <span :class="{ 'text-grey-400': !selectedGroup.name }">
                    {{ selectedGroup.name || "Select or type the group app" }}
                  </span>
                </div>
                <i
                  class="pi pi-chevron-down text-grey-400 transition-transform"
                  :class="{ 'rotate-180': showGroupDropdown }"
                ></i>
              </div>

              <div
                v-if="showGroupDropdown"
                class="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-grey-800 border border-grey-300 dark:border-grey-600 rounded-md shadow-lg z-10"
              >
                <div class="p-2 border-b border-grey-200 dark:border-grey-700">
                  <div class="relative">
                    <input
                      v-model="groupSearchTerm"
                      placeholder="Type new one"
                      class="w-full pl-3 pr-10 py-2 border border-grey-300 dark:border-grey-600 rounded-md bg-transparent outline-none text-text-main focus:ring-1 focus:ring-primary"
                    />
                    <div class="absolute right-2 top-1/2 -translate-y-1/2">
                      <button
                        @click="toggleIconDropdown"
                        class="p-1 rounded-md text-grey-500 hover:bg-grey-100 dark:hover:bg-grey-700 relative"
                        title="Select icon for new group"
                      >
                        <i :class="selectedIcon || 'pi pi-building'"></i>

                        <!-- Icon Dropdown -->
                        <div
                          v-if="showIconDropdown"
                          class="absolute top-full right-0 mt-1 bg-white dark:bg-grey-800 border border-grey-300 dark:border-grey-600 rounded-md shadow-lg z-30 p-2"
                          @click.stop
                        >
                          <div
                            class="grid grid-cols-4 sm:grid-cols-5 gap-1 w-40 sm:w-48"
                          >
                            <button
                              v-for="icon in availableIcons.slice(0, 10)"
                              :key="icon.class"
                              @click="selectIcon(icon.class)"
                              class="flex items-center justify-center p-1.5 sm:p-2 rounded-md border transition-colors hover:border-primary hover:bg-primary-50 dark:hover:bg-primary-900/20"
                              :class="{
                                'border-primary bg-primary-50 dark:bg-primary-900/20':
                                  selectedIcon === icon.class,
                                'border-grey-200 dark:border-grey-700':
                                  selectedIcon !== icon.class,
                              }"
                              :title="icon.name"
                            >
                              <i
                                :class="icon.class"
                                class="text-base sm:text-lg text-grey-600 dark:text-grey-400"
                              ></i>
                            </button>
                          </div>
                          <div
                            class="grid grid-cols-4 sm:grid-cols-5 gap-1 mt-1"
                          >
                            <button
                              v-for="icon in availableIcons.slice(10, 20)"
                              :key="icon.class"
                              @click="selectIcon(icon.class)"
                              class="flex items-center justify-center p-1.5 sm:p-2 rounded-md border transition-colors hover:border-primary hover:bg-primary-50 dark:hover:bg-primary-900/20"
                              :class="{
                                'border-primary bg-primary-50 dark:bg-primary-900/20':
                                  selectedIcon === icon.class,
                                'border-grey-200 dark:border-grey-700':
                                  selectedIcon !== icon.class,
                              }"
                              :title="icon.name"
                            >
                              <i
                                :class="icon.class"
                                class="text-base sm:text-lg text-grey-600 dark:text-grey-400"
                              ></i>
                            </button>
                          </div>
                        </div>
                      </button>
                    </div>
                  </div>
                </div>

                <div class="max-h-40 overflow-y-auto">
                  <div
                    v-for="group in filteredGroups"
                    :key="group.name"
                    @click="selectGroup(group)"
                    class="flex items-center gap-3 px-3 py-2 hover:bg-grey-50 dark:hover:bg-grey-700 cursor-pointer"
                  >
                    <i
                      :class="group.icon"
                      class="text-grey-500 w-4 text-center"
                    ></i>
                    <span class="text-text-main text-sm">{{ group.name }}</span>
                  </div>
                  <div
                    v-if="!filteredGroups.length && !groupSearchTerm"
                    class="px-3 py-2 text-sm text-grey-400"
                  >
                    No groups available.
                  </div>
                  <div
                    v-if="!filteredGroups.length && groupSearchTerm"
                    class="px-3 py-2 text-sm text-grey-400"
                  >
                    No group found. Type and click the icon to add.
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-text-main mb-2">
              Category
            </label>
            <div class="relative" ref="categoryWrapper">
              <div
                @click="toggleCategoryDropdown"
                class="w-full px-3 py-2 border border-grey-300 dark:border-grey-600 rounded-md bg-white dark:bg-grey-800 text-text-main cursor-pointer flex items-center justify-between"
              >
                <span :class="{ 'text-grey-400': !selectedCategory }">
                  {{ selectedCategory || "Select or type category of app" }}
                </span>
                <i class="pi pi-chevron-down text-grey-400"></i>
              </div>

              <div
                v-if="showCategoryDropdown"
                class="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-grey-800 border border-grey-300 dark:border-grey-600 rounded-md shadow-lg z-20"
              >
                <div class="p-3 border-b border-grey-200 dark:border-grey-700">
                  <input
                    v-model="categorySearchTerm"
                    @keydown.enter="addNewCategory"
                    placeholder="Type new category"
                    class="w-full px-3 py-2 border border-grey-300 dark:border-grey-600 rounded-md bg-transparent outline-none text-text-main text-sm"
                  />
                </div>

                <div class="max-h-40 overflow-y-auto">
                  <div
                    v-for="category in filteredCategories"
                    :key="category"
                    @click="selectCategory(category)"
                    class="px-3 py-2 hover:bg-grey-50 dark:hover:bg-grey-700 cursor-pointer"
                  >
                    <span class="text-text-main text-sm">{{ category }}</span>
                  </div>
                  <div
                    v-if="!filteredCategories.length && !categorySearchTerm"
                    class="px-3 py-2 text-sm text-grey-400"
                  >
                    No categories available.
                  </div>
                  <div
                    v-if="!filteredCategories.length && categorySearchTerm"
                    class="px-3 py-2 text-sm text-grey-400"
                  >
                    No category found. Press Enter to add.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div>
          <UiInput
            v-model="form.url"
            label="Url App"
            placeholder="Enter the link or IP apps"
            type="url"
            icon="pi pi-link"
            icon-spacing="ml-2"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-text-main mb-2">
            Description
          </label>
          <textarea
            v-model="form.description"
            placeholder="Type description of app"
            rows="3"
            class="w-full px-3 py-2 border border-grey-300 dark:border-grey-600 rounded-md bg-white dark:bg-grey-800 text-text-main placeholder-grey-400 focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
          ></textarea>
        </div>

        <div>
          <UiToggle v-model="form.isActive" label="Active" />
        </div>
      </div>

      <div
        class="p-4 sm:p-6 border-t border-grey-200 dark:border-grey-700 flex-shrink-0"
      >
        <UiButton variant="primary" class="w-full" @click="handleSubmit">
          Create app
        </UiButton>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from "vue";
import { onClickOutside } from "@vueuse/core";
import UiInput from "./Input.vue";
import UiButton from "./Button.vue";
import UiToggle from "./Toggle.vue";

// Props & Emits (no change)
const props = defineProps({ isOpen: { type: Boolean, default: false } });
const emit = defineEmits(["close", "submit"]);

// Refs for DOM elements
const groupWrapper = ref(null);
const categoryWrapper = ref(null);
const logoInput = ref(null);

// Form data
const form = ref({
  name: "",
  category: "",
  url: "",
  description: "",
  isActive: true,
});

// Logo upload state
const logoPreview = ref(null);

// Group selection state
const selectedGroup = ref({ name: "", icon: "" });
const showGroupDropdown = ref(false);
const groupSearchTerm = ref("");
const showIconModal = ref(false);
const showIconDropdown = ref(false);
const selectedIcon = ref("pi pi-building");
const availableGroups = ref([
  { name: "IT Platform", icon: "pi pi-desktop" },
  { name: "HC Platform", icon: "pi pi-users" },
]);

// Category selection state
const selectedCategory = ref("");
const showCategoryDropdown = ref(false);
const categorySearchTerm = ref("");
const availableCategories = ref([
  "Human Resources",
  "Finance",
  "IT & Technology",
  "Operations",
  "Marketing",
  "Sales",
]);

// Available icons for group selection
const availableIcons = ref([
  { name: "Users", class: "pi pi-users" },
  { name: "Desktop", class: "pi pi-desktop" },
  { name: "Globe", class: "pi pi-globe" },
  { name: "Lock", class: "pi pi-lock" },
  { name: "Mobile", class: "pi pi-mobile" },
  { name: "Cloud", class: "pi pi-cloud" },
  { name: "Chart", class: "pi pi-chart-bar" },
  { name: "Database", class: "pi pi-database" },
  { name: "Cog", class: "pi pi-cog" },
  { name: "Shield", class: "pi pi-shield" },
  { name: "Heart", class: "pi pi-heart" },
  { name: "Star", class: "pi pi-star" },
  { name: "Home", class: "pi pi-home" },
  { name: "Building", class: "pi pi-building" },
  { name: "Briefcase", class: "pi pi-briefcase" },
  { name: "Money", class: "pi pi-dollar" },
  { name: "Cart", class: "pi pi-shopping-cart" },
  { name: "Bell", class: "pi pi-bell" },
  { name: "Calendar", class: "pi pi-calendar" },
  { name: "Clock", class: "pi pi-clock" },
]);

// Computed properties
const filteredGroups = computed(() => {
  if (!groupSearchTerm.value) return availableGroups.value;
  return availableGroups.value.filter((group) =>
    group.name.toLowerCase().includes(groupSearchTerm.value.toLowerCase())
  );
});

const filteredCategories = computed(() => {
  if (!categorySearchTerm.value) return availableCategories.value;
  return availableCategories.value.filter((category) =>
    category.toLowerCase().includes(categorySearchTerm.value.toLowerCase())
  );
});

// Methods
const closeModal = () => {
  emit("close");
};

const resetForm = () => {
  form.value = {
    name: "",
    category: "",
    url: "",
    description: "",
    isActive: true,
  };
  selectedGroup.value = { name: "", icon: "" };
  selectedCategory.value = "";
  logoPreview.value = null;
  groupSearchTerm.value = "";
  categorySearchTerm.value = "";
  showGroupDropdown.value = false;
  showCategoryDropdown.value = false;
  showIconDropdown.value = false;
  selectedIcon.value = "pi pi-building";
};

watch(
  () => props.isOpen,
  (newVal) => {
    if (!newVal) {
      setTimeout(resetForm, 200); // Reset after closing animation
    }
  }
);

// Dropdown handling
const toggleGroupDropdown = () => {
  showGroupDropdown.value = !showGroupDropdown.value;
  showCategoryDropdown.value = false;
  showIconDropdown.value = false;
};

const toggleCategoryDropdown = () => {
  showCategoryDropdown.value = !showCategoryDropdown.value;
  showGroupDropdown.value = false;
  showIconDropdown.value = false;
};

const toggleIconDropdown = () => {
  showIconDropdown.value = !showIconDropdown.value;
};

onClickOutside(groupWrapper, () => {
  showGroupDropdown.value = false;
  showIconDropdown.value = false;
});

onClickOutside(categoryWrapper, () => {
  showCategoryDropdown.value = false;
});

const selectGroup = (group) => {
  selectedGroup.value = { ...group };
  showGroupDropdown.value = false;
  groupSearchTerm.value = "";
};

const selectCategory = (category) => {
  selectedCategory.value = category;
  form.value.category = category;
  showCategoryDropdown.value = false;
  categorySearchTerm.value = "";
};

const selectIcon = (iconClass) => {
  selectedIcon.value = iconClass;
  showIconDropdown.value = false;
  addNewGroup(); // Automatically add the group when icon is selected
};

// "Add New Group" flow
const addNewGroup = () => {
  if (groupSearchTerm.value.trim() && selectedIcon.value) {
    const newGroup = {
      name: groupSearchTerm.value,
      icon: selectedIcon.value,
    };
    if (
      !availableGroups.value.some(
        (g) => g.name.toLowerCase() === newGroup.name.toLowerCase()
      )
    ) {
      availableGroups.value.push(newGroup);
    }
    selectedGroup.value = { ...newGroup };
    showGroupDropdown.value = false;
    groupSearchTerm.value = "";
    selectedIcon.value = "pi pi-building";
  }
};

const addNewCategory = () => {
  if (categorySearchTerm.value.trim()) {
    if (
      !availableCategories.value.some(
        (c) => c.toLowerCase() === categorySearchTerm.value.toLowerCase()
      )
    ) {
      availableCategories.value.push(categorySearchTerm.value);
    }
    selectedCategory.value = categorySearchTerm.value;
    form.value.category = categorySearchTerm.value;
    showCategoryDropdown.value = false;
    categorySearchTerm.value = "";
  }
};

// Logo upload handling
const handleLogoUpload = (event) => {
  const file = event.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      logoPreview.value = e.target.result;
    };
    reader.readAsDataURL(file);
  }
};

// Get logo initials from app name
const getLogoInitials = () => {
  if (form.value.name) {
    const words = form.value.name.trim().split(" ");
    if (words.length >= 2) {
      return (words[0][0] + words[1][0]).toUpperCase();
    } else if (words[0].length >= 2) {
      return words[0].substring(0, 2).toUpperCase();
    } else {
      return words[0][0].toUpperCase();
    }
  }
  return "SA";
};

// Form submission
const handleSubmit = () => {
  const appData = {
    ...form.value,
    category: selectedCategory.value || form.value.category,
    group: selectedGroup.value,
    logo: logoPreview.value,
  };
  emit("submit", appData);
  closeModal();
};
</script>
