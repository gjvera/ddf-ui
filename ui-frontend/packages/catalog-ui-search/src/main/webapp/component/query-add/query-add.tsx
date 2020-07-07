/**
 * Copyright (c) Codice Foundation
 *
 * This is free software: you can redistribute it and/or modify it under the terms of the GNU Lesser
 * General Public License as published by the Free Software Foundation, either version 3 of the
 * License, or any later version.
 *
 * This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without
 * even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU
 * Lesser General Public License for more details. A copy of the GNU Lesser General Public License
 * is distributed along with this program and can be found at
 * <http://www.gnu.org/licenses/lgpl.html>.
 *
 **/

import * as React from 'react'
const Marionette = require('marionette')
const CustomElements = require('../../js/CustomElements.js')
const QueryTitle = require('../query-title/query-title.view.js')
const Query = require('../../js/model/Query.js')
const user = require('../singletons/user-instance.js')
import Grid from '@material-ui/core/Grid'
const QueryAdhoc = require('../../component/query-adhoc/query-adhoc.view.js')
const QueryBasic = require('../../component/query-basic/query-basic.view.js')
const QueryAdvanced = require('../../component/query-advanced/query-advanced.view.js')
const CQLUtils = require('catalog-ui-search/src/main/webapp/js/CQLUtils.js')

const { createAction } = require('imperio')

const { register, unregister } = createAction({
  type: 'query/START-SEARCH',
  docs: 'Run a search',
})

export const queryForms = [
  { id: 'text', title: 'Text Search', view: QueryAdhoc },
  { id: 'basic', title: 'Basic Search', view: QueryBasic },
  {
    id: 'advanced',
    title: 'Advanced Search',
    view: QueryAdvanced,
    options: {
      isAdd: true,
    },
  },
]

export default Marionette.LayoutView.extend({
  template() {
    return (
      <React.Fragment>
        <form
          target="autocomplete"
          action="/search/catalog/blank.html"
          className="w-full h-full"
        >
          <Grid
            container
            direction="column"
            className="w-full h-full"
            wrap="nowrap"
          >
            <Grid item style={{ width: '100%', display: 'none' }}>
              <div className="content-title" />
            </Grid>
            <Grid item className="w-full h-full">
              <div className="content-form" />
            </Grid>
          </Grid>
        </form>
      </React.Fragment>
    )
  },
  className: 'global-query-add-view h-full w-full overflow-auto',
  tagName: 'div',
  regions: {
    queryContent: 'form .content-form',
    queryTitle: 'form .content-title',
  },
  events: {
    'click .editor-edit': 'edit',
    'click .editor-cancel': 'cancel',
    'click .editor-save': 'save',
    'click .editor-saveRun': 'saveRun',
  },
  initialize() {
    this.model =
      this.model !== null ? this.model : new Query.Model(this.getDefaultQuery())
    this.listenTo(this.model, 'resetToDefaults change:type', this.reshow)
    this.listenTo(this.model, 'change:filterTree', this.reshow)
    this.listenTo(this.model, 'closeDropdown', this.closeDropdown)
    this.listenForSave()
  },
  reshow() {
    setTimeout(() => {
      this.queryView = undefined
      const formType = this.model.get('type')
      switch (formType) {
        case 'text':
        case 'basic':
        case 'advanced':
          this.showForm(queryForms.find(form => form.id === formType))
          break
        default:
          const queryForm = queryForms.find(form => form.id === formType)
          if (queryForm) {
            this.showQueryForm(queryForm)
          }
      }
    }, 0)
  },
  onBeforeShow() {
    this.reshow()
    this.showTitle()

    this.action = register({
      el: this.el,
      fn: () => {
        this.saveRun()
      },
    })
  },
  onDestroy() {
    unregister(this.action)
  },
  getDefaultQuery() {
    let userDefaultTemplate = user.getQuerySettings().get('template')
    if (!userDefaultTemplate) {
      return {}
    }
    let sorts =
      userDefaultTemplate['querySettings'] &&
      userDefaultTemplate['querySettings'].sorts
    if (sorts) {
      sorts = sorts.map((sort: any) => ({
        attribute: sort.split(',')[0],
        direction: sort.split(',')[1],
      }))
    }
    return {
      type: 'custom',
      title: userDefaultTemplate['title'],
      filterTree: userDefaultTemplate['filterTemplate'],
      src:
        (userDefaultTemplate['querySettings'] &&
          userDefaultTemplate['querySettings'].src) ||
        '',
      federation:
        (userDefaultTemplate['querySettings'] &&
          userDefaultTemplate['querySettings'].federation) ||
        'enterprise',
      sorts: sorts || [],
      'detail-level':
        (userDefaultTemplate['querySettings'] &&
          userDefaultTemplate['querySettings']['detail-level']) ||
        'allFields',
    }
  },
  showTitle() {
    this.queryTitle.show(
      new QueryTitle({
        model: this.model,
      })
    )
  },
  showFormBuilder() {
    this.queryContent.show(
      new QueryAdvanced({
        model: this.model,
      })
    )
  },
  showForm(form: any) {
    const options = form.options || {}
    this.queryContent.show(
      new form.view({
        model: this.model,
        ...options,
      })
    )
  },
  showQueryForm(form: any) {
    const options = form.options || {}
    const queryFormView = Marionette.LayoutView.extend({
      template: () => (
        <form.view
          model={this.model}
          options={options}
          onRef={(ref: any) => (this.queryView = ref)}
        />
      ),
    })
    this.queryContent.show(new queryFormView({}))
  },
  handleEditOnShow() {
    if (this.$el.hasClass('is-editing')) {
      this.edit()
    }
  },
  showCustom() {
    this.queryContent.show(
      new QueryAdvanced({
        model: this.model,
      })
    )
  },
  focus() {
    if (!this.queryView) {
      this.queryContent.currentView.focus()
    }
  },
  edit() {
    this.$el.addClass('is-editing')
    if (!this.queryView) {
      this.queryContent.currentView.edit()
    }
  },
  cancel() {
    this.$el.removeClass('is-editing')
    this.onBeforeShow()
  },
  save() {
    this.queryView
      ? this.queryView.save()
      : this.queryContent.currentView.save()
    this.queryTitle.currentView.save()
    this.cancel()
    this.$el.trigger('closeDropdown.' + CustomElements.getNamespace())
  },
  setDefaultTitle() {
    this.queryView
      ? this.queryView.setDefaultTitle()
      : this.queryContent.currentView.setDefaultTitle()
  },
  saveRun() {
    this._updateModel()
    this.options.selectionInterface.setCurrentQuery(this.model)
    console.log(this.model.toJSON())
    this.model.startSearchFromFirstPage()
  },
  _updateModel() {
    const queryContentView = this.queryView
      ? this.queryView
      : this.queryContent.currentView
    queryContentView.save()
    this.queryTitle.currentView.save()

    if (this.model.get('type') === 'text') {
      this.model.set(
        'filterTree',
        CQLUtils.transformCQLToFilter(this.model.get('cql'))
      )
      if (!this.options.isSaved) {
        this.model.set('title', this.model.get('filterTree').value)
      }
    } else if (!this.options.isSaved && this.model.get('type') !== 'text') {
      this.model.set('title', this.model.get('filterTree').filters[0].value)
    }

    queryContentView.save()
  },
  listenForSave() {
    this.$el
      .off('saveQuery.' + CustomElements.getNamespace())
      .on('saveQuery.' + CustomElements.getNamespace(), e => {
        this.saveRun()
      })
  },
  closeDropdown() {
    this.$el.trigger('closeDropdown.' + CustomElements.getNamespace())
  },
})
