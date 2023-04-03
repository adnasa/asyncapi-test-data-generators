// eslint-disable-next-line no-unused-vars
import { Schema } from '@asyncapi/parser';
import { File } from '@asyncapi/generator-react-sdk';
import { oneLine, stripIndents } from 'common-tags';
import kebabCase from 'lodash.kebabcase';

const parserSchemaName = 'x-parser-schema-id';

/**
 * @typedef SchemaRenderParams
 * @type object
 * @property {schema} Schema
 * @property {string} schemaName
 * @property {string} params
 */

const renderSchemaByProperty = ({ schemaName, property }) => {
  const [name, propertySchema] = property;
  const propertyType = propertySchema.type();

  if (propertyType === 'string') {
    if (propertySchema.enum()) {
      const enumValues = propertySchema
        .enum()
        .map((x) => `'${x}'`)
        .join(' | ');
      return `${name}: ${enumValues}`;
    }
    return `${name}: ${propertyType}`;
  }

  if (propertyType === 'number') {
    if (propertySchema.enum()) {
      const enumValues = propertySchema.enum().join(' | ');
      return `${name}: ${enumValues}`;
    }
    return `${name}: ${propertyType}`;
  }

  if (propertyType === 'object') {
    return `${name}: ${propertySchema.extension(parserSchemaName)}`;
  }

  return null;
};

/**
 * @param SchemaRenderParams schemaRenderParams
 */
const renderSchema = (schemaRenderParams) => {
  const properties = schemaRenderParams.schema.properties();

  const extensionImports = Object.entries(properties)
    .filter(([key, value]) => value.type() === 'object')
    .map(([key, value]) => value.extension(parserSchemaName))
    .map(
      (extension) => oneLine`
        import
        type
        { ${extension} }
        from 
        './${kebabCase(extension)}'
      `
    )
    .join('\n');

  const renderedProperties = Object.entries(properties)
    .map((property) =>
      renderSchemaByProperty({
        schemaName: schemaRenderParams.schemaName,
        property,
      })
    )
    .filter(Boolean)
    .join(';\n');

  return (
    <File name={`${kebabCase(schemaRenderParams.schemaName)}.ts`}>
      {stripIndents`
        ${extensionImports}

        type ${schemaRenderParams.schemaName} = {
          ${renderedProperties}
        }

        export { ${schemaRenderParams.schemaName} }
      `}
    </File>
  );
};

export default renderSchema;
