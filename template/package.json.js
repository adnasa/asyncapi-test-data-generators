import kebabCase from 'lodash.kebabcase';
import { File } from '@asyncapi/generator-react-sdk';

export default function packageFile({ asyncapi }) {
  const packageJSON = {
    name: 'generated-test-data',
    description: '',
    version: '0.0.1',
    scripts: {},
    devDependencies: {
      'ts-node': '^10.4.0',
      '@types/node': '13.9.5',
      '@faker-js/faker': '^7.6.0',
      typescript: '4.5.2',
    },
  };

  if (asyncapi.info().title()) {
    packageJSON.name = kebabCase(asyncapi.info().title());
  }
  if (asyncapi.info().version()) {
    packageJSON.version = asyncapi.info().version();
  }
  if (asyncapi.info().description()) {
    packageJSON.description = asyncapi.info().description();
  }

  return (
    <File name={'package.json'}>{JSON.stringify(packageJSON, null, 2)}</File>
  );
}
