import React from 'react';

import { Text } from '../../component-library';
import WasabiLogo from '.';

export default {
  title: 'Components/UI/WasabiLogo',

  argTypes: {
    onClick: {
      action: 'onClick',
    },
    unsetIconHeight: {
      control: 'boolean',
    },
    isOnboarding: {
      control: 'boolean',
    },
  },
};

export const DefaultStory = (args) => (
  <>
    <WasabiLogo {...args} />
    <Text marginTop={4} as="p">
      To view the different logo types change the build type in:
      ui/components/ui/metafox-logo/horizontal-logo.js
    </Text>
  </>
);

DefaultStory.storyName = 'Default';
