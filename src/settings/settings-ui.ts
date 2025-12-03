import { Setting } from 'obsidian'
import type OmnisearchPlugin from 'src/main'
import { showExcerpt } from '.'
import type { FolderScopeSelection, OmnisearchSettings } from './utils'
import {
  ensureDefaultFolderScope,
  ensureFolderScopes,
  htmlDescription,
  MAX_FOLDER_SCOPES,
  saveSettings,
} from './utils'
import { normalizeFolderPath } from '../tools/utils'

export function injectSettingsUserInterface(
  plugin: OmnisearchPlugin,
  settings: OmnisearchSettings,
  containerEl: HTMLElement
) {
  new Setting(containerEl).setName('User Interface').setHeading()

  // Show Ribbon Icon
  new Setting(containerEl)
    .setName('Show ribbon button')
    .setDesc('Add a button on the sidebar to open the Vault search modal.')
    .addToggle(toggle =>
      toggle.setValue(settings.ribbonIcon).onChange(async v => {
        settings.ribbonIcon = v
        await saveSettings(plugin)
        if (v) {
          plugin.addRibbonButton()
        } else {
          plugin.removeRibbonButton()
        }
      })
    )

  // Show context excerpt
  new Setting(containerEl)
    .setName('Show excerpts')
    .setDesc(
      'Shows the contextual part of the note that matches the search. Disable this to only show filenames in results.'
    )
    .addToggle(toggle =>
      toggle.setValue(settings.showExcerpt).onChange(async v => {
        showExcerpt.set(v)
      })
    )

  // Show embeds
  new Setting(containerEl)
    .setName('Show embed references')
    .setDesc(
      htmlDescription(`Some results are <a href="https://help.obsidian.md/Linking+notes+and+files/Embed+files">embedded</a> in other notes.<br>
            This setting controls the maximum number of embeds to show in the search results. Set to 0 to disable.<br>
            Also works with Text Extractor for embedded images and documents.`)
    )
    .addSlider(cb => {
      cb.setLimits(0, 10, 1)
        .setValue(settings.maxEmbeds)
        .setDynamicTooltip()
        .onChange(async v => {
          settings.maxEmbeds = v
          await saveSettings(plugin)
        })
    })

  // Keep line returns in excerpts
  new Setting(containerEl)
    .setName('Render line return in excerpts')
    .setDesc('Activate this option to render line returns in result excerpts.')
    .addToggle(toggle =>
      toggle.setValue(settings.renderLineReturnInExcerpts).onChange(async v => {
        settings.renderLineReturnInExcerpts = v
        await saveSettings(plugin)
      })
    )

  // Show "Create note" button
  new Setting(containerEl)
    .setName('Show "Create note" button')
    .setDesc(
      htmlDescription(`Shows a button next to the search input, to create a note.
          Acts the same as the <code>shift ↵</code> shortcut, can be useful for mobile device users.`)
    )
    .addToggle(toggle =>
      toggle.setValue(settings.showCreateButton).onChange(async v => {
        settings.showCreateButton = v
        await saveSettings(plugin)
      })
    )

  settings.folderScopes = ensureFolderScopes(settings.folderScopes)
  new Setting(containerEl)
    .setName('Folder presets')
    .setDesc(
      'Define up to 5 folder shortcuts that appear in the vault search modal.'
    )
    .setHeading()
  for (let i = 0; i < MAX_FOLDER_SCOPES; i++) {
    const preset = settings.folderScopes[i]
    new Setting(containerEl)
      .setName(`Folder ${i + 1}`)
      .setDesc('Folder path (relative to vault) and alias to display.')
      .addText(text =>
        text
          .setPlaceholder('Folder path')
          .setValue(preset?.path ?? '')
          .onChange(async value => {
            settings.folderScopes[i].path = normalizeFolderPath(value)
            settings.defaultFolderScope = ensureDefaultFolderScope(
              settings.defaultFolderScope,
              settings.folderScopes
            )
            await saveSettings(plugin)
          })
      )
      .addText(text =>
        text
          .setPlaceholder('Alias')
          .setValue(preset?.alias ?? '')
          .onChange(async value => {
            settings.folderScopes[i].alias = value.trim()
            await saveSettings(plugin)
          })
      )
  }

  new Setting(containerEl)
    .setName('Default folder filter')
    .setDesc(
      'Choose which folder preset (or all folders) is selected when opening vault search.'
    )
    .addDropdown(dropdown => {
      const options: Record<string, string> = { all: 'All folders' }
      settings.folderScopes.forEach((scope, i) => {
        const label = scope.alias?.trim() || scope.path || `Folder ${i + 1}`
        options[i.toString()] = label
      })
      dropdown.addOptions(options)
      dropdown.setValue(
        settings.defaultFolderScope === 'all'
          ? 'all'
          : (settings.defaultFolderScope as Exclude<
              FolderScopeSelection,
              'all'
            >).toString()
      )
      dropdown.onChange(async value => {
        const next = value === 'all' ? 'all' : parseInt(value, 10)
        settings.defaultFolderScope = ensureDefaultFolderScope(
          next,
          settings.folderScopes
        )
        await saveSettings(plugin)
      })
    })

  // Highlight results
  new Setting(containerEl)
    .setName('Highlight matching words in results')
    .setDesc(
      'Will highlight matching results when enabled. See README for more customization options.'
    )
    .addToggle(toggle =>
      toggle.setValue(settings.highlight).onChange(async v => {
        settings.highlight = v
        await saveSettings(plugin)
      })
    )

  new Setting(containerEl)
    .setName('Default vault sort order')
    .setDesc('Choose how results are ordered when the search modal opens.')
    .addDropdown(dropdown =>
      dropdown
        .addOptions({
          relevance: 'Relevance',
          lastEdited: 'Last edited',
        })
        .setValue(settings.defaultVaultSort)
        .onChange(async value => {
          settings.defaultVaultSort = (value === 'lastEdited'
            ? 'lastEdited'
            : 'relevance') as 'relevance' | 'lastEdited'
          await saveSettings(plugin)
        })
    )
}
