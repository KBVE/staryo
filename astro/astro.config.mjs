// @ts-check
import { defineConfig } from 'astro/config';
import worker from "@astropub/worker"

import { defineConfig as defineViteConfig } from 'vite';
import starlight from '@astrojs/starlight';
import starlightThemeGalaxy from 'starlight-theme-galaxy';
import tailwindcss from '@tailwindcss/vite';

import react from '@astrojs/react';

// https://astro.build/config
export default defineConfig({
    output: 'static',
  integrations: [worker(), starlight({
      plugins: [starlightThemeGalaxy()],
      title: 'Staryo',
      customCss: [
          // Path to your custom CSS file with cascade layers and purple theme
            './src/styles/global.css',
      ],
      social: [{ icon: 'github', label: 'GitHub', href: 'https://github.com/withastro/starlight' }],
      sidebar: [
          {
              label: 'Guides',
              items: [
                  // Each item here is one entry in the navigation menu.
                  { label: 'Example Guide', slug: 'guides/example' },
              ],
          },
          {
              label: 'Reference',
              autogenerate: { directory: 'reference' },
          },
      ],
		  components: {
        SiteTitle: './src/components/navigation/SiteTitle.astro',
		  }
  }), react()],

  vite: {
    plugins: [tailwindcss()],
  },
});