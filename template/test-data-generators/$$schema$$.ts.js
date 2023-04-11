// eslint-disable-next-line no-unused-vars
import { Schema } from '@asyncapi/parser';
import { File } from '@asyncapi/generator-react-sdk';
import { oneLine, stripIndents } from 'common-tags';
import { dash, camel } from 'radash';

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

  if (propertySchema.isCircular()) {
    throw new Error('Recursive schema is not supported');
  }

  if (propertyType === 'string') {
    if (propertySchema.enum()) {
      const enumValues = propertySchema
        .enum()
        .map((x) => `'${x}'`)
        .join(',');
      return `${name}: faker.helpers.arrayElement([${enumValues}])`;
    }

    if (propertySchema._json.example) {
      return `${name}: '${propertySchema._json.example}'`;
    }

    if (propertySchema.format() === 'uuid') {
      return `${name}: faker.datatype.uuid()`;
    }

    if (propertySchema.format() === 'date-time') {
      return `${name}: faker.date.past().toISOString()`;
    }

    return `${name}: faker.word.noun()`;
  }

  if (propertyType === 'number') {
    if (propertySchema.enum()) {
      const enumValues = propertySchema.enum().join(',');
      return `${name}: faker.helpers.arrayElement([${enumValues}])`;
    }
    return `${name}: faker.datatype.number()`;
  }

  if (propertyType === 'object') {
    return oneLine`
      ${name}: 
      ${camel(`create ${propertySchema.extension(parserSchemaName)}`)}()
    `;
  }
  return null;
};

/**
 * @param SchemaRenderParams schemaRenderParams
 */
const renderSchema = (schemaRenderParams) => {
  const properties = schemaRenderParams.schema.properties();

  const typeImport = oneLine`
    import type
    { ${schemaRenderParams.schemaName} }
    from '../schemas/${dash(schemaRenderParams.schemaName)}'
  `;

  const extensionTestGeneratorImport = Object.values(properties)
    .filter((value) => value.type() === 'object')
    .map((value) => value.extension(parserSchemaName))
    .map(
      (extension) => oneLine`
          import ${camel(`create ${extension}`)}
          from
          './${dash(extension)}'
        `
    )
    .join('\n');

  const functionName = camel(oneLine`
    create test ${schemaRenderParams.schemaName}
  `);

  const renderedProperties = Object.entries(properties)
    .map((property) =>
      renderSchemaByProperty({
        schemaName: schemaRenderParams.schemaName,
        property,
      })
    )
    .filter(Boolean)
    .join(',\n');

  return (
    <File name={`${dash(schemaRenderParams.schemaName)}.ts`}>
      {stripIndents`
        import { faker } from '@faker-js/faker'

        ${typeImport}
        ${extensionTestGeneratorImport}

        const ${functionName} = (custom: Partial<${schemaRenderParams.schemaName}> = {}): ${schemaRenderParams.schemaName} => ({
            ${renderedProperties},
            ...custom,
          })

        export default ${functionName}
      `}
    </File>
  );
};

export default renderSchema;
