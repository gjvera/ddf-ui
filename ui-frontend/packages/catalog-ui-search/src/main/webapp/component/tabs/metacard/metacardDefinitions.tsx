/**
 * types for metacard defs
 */

import { hot } from 'react-hot-loader'
const metacardDefinitions = require('../../singletons/metacard-definitions')
const properties = require('../../../js/properties.js')
const Common = require('../../../js/Common.js')
type Attributetypes =
  | 'BINARY'
  | 'DATE'
  | 'LOCATION'
  | 'GEOMETRY'
  | 'LONG'
  | 'DOUBLE'
  | 'FLOAT'
  | 'INTEGER'
  | 'SHORT'
  | 'STRING'
  | 'BOOLEAN'
  | 'XML'

const TypedMetacardDefs = {
  isHiddenTypeExceptThumbnail({ attr }: { attr: string }): boolean {
    return metacardDefinitions.isHiddenTypeExceptThumbnail(attr)
  },
  getType({ attr }: { attr: string }): Attributetypes {
    return metacardDefinitions.metacardTypes[attr].type
  },
  getAlias({ attr }: { attr: string }): string {
    return properties.attributeAliases[attr] || attr
  },
  isMulti({ attr }: { attr: string }): boolean {
    return metacardDefinitions.metacardTypes[attr].multivalued || false
  },
  isReadonly({ attr }: { attr: string }): boolean {
    return properties.isReadOnly(attr) || false
  },
  getImageSrc({ val }: { val: string }): string {
    if (typeof val === 'string' && val.substring(0, 4) !== 'http') {
      return val.split('?_=')[0]
    }
    return Common.getImageSrc(val)
  },
  getDefinition({
    type,
  }: {
    type: string
  }): {
    [key: string]: {
      alias: undefined | string
      hidden: boolean
      id: string
      isInjected: boolean
      multivalued: boolean
      readOnly: boolean
      type: Attributetypes
    }
  } {
    return metacardDefinitions.metacardDefinitions[type] || {}
  },
  getEnum({ attr }: { attr: string }) {
    return metacardDefinitions.enums[attr] as string[] | undefined
  },
  typesFetched() {
    return metacardDefinitions.typesFetched as boolean
  },
}

export default hot(module)(TypedMetacardDefs)
