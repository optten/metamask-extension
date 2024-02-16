import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import { Box } from '../../component-library';
import { BackgroundColor } from '../../../helpers/constants/design-system';

export default class MetaFoxLogo extends PureComponent {
  static propTypes = {
    onClick: PropTypes.func,
    unsetIconHeight: PropTypes.bool,
    isOnboarding: PropTypes.bool,
    ///: BEGIN:ONLY_INCLUDE_IF(build-flask)
    src: PropTypes.string,
    ///: END:ONLY_INCLUDE_IF
    ///: BEGIN:ONLY_INCLUDE_IF(build-mmi)
    theme: PropTypes.string,
    ///: END:ONLY_INCLUDE_IF
  };

  static defaultProps = {
    onClick: undefined,
  };

  render() {
    const {
      onClick,
      unsetIconHeight,
      isOnboarding,
      ///: BEGIN:ONLY_INCLUDE_IF(build-flask)
      src,
      ///: END:ONLY_INCLUDE_IF
      ///: BEGIN:ONLY_INCLUDE_IF(build-mmi)
      theme,
      ///: END:ONLY_INCLUDE_IF
    } = this.props;
    const iconProps = unsetIconHeight ? {} : { height: 42, width: 42 };

    iconProps.src = './images/logo/wasabi_text.svg';

    ///: BEGIN:ONLY_INCLUDE_IF(build-mmi)
    iconProps.src = './build-types/mmi/images/logo/mmi-logo-with-words.svg';
    ///: END:ONLY_INCLUDE_IF

    let imageSrc =
      document.documentElement.getAttribute('data-theme') === 'dark'
        ? './images/logo/wasabi_text_white.svg'
        : './images/logo/wasabi_text.svg';

    ///: BEGIN:ONLY_INCLUDE_IF(build-flask)
    if (src) {
      imageSrc = src;
    }
    ///: END:ONLY_INCLUDE_IF

    return (
      <Box
        as="button"
        onClick={onClick}
        className={classnames({
          'app-header__logo-container': !isOnboarding,
          'onboarding-app-header__logo-container': isOnboarding,
          'app-header__logo-container--clickable': Boolean(onClick),
        })}
        backgroundColor={BackgroundColor.transparent}
        data-testid="app-header-logo"
      >
        {/* {renderHorizontalLogo()} */}
        <div className="wasabi-logo-container">
          <img
            {...iconProps}
            src={imageSrc}
            className={classnames({
              'app-header__metafox-logo--icon': !isOnboarding,
              'onboarding-app-header__metafox-logo--icon': isOnboarding,
            })}
            alt=""
          />
        </div>
      </Box>
    );
  }
}
