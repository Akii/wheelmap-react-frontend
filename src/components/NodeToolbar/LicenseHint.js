// @flow

import styled from 'styled-components';
import React, { Component } from 'react';
import { dataSourceCache } from '../../lib/cache/DataSourceCache';
import { licenseCache } from '../../lib/cache/LicenseCache';
import type { AccessibilityCloudProperties } from '../../lib/Feature';

type Props = {
  properties: AccessibilityCloudProperties,
  className: string,
};

type State = {
  license: ?{},
  source: ?{},
};

const defaultState = { license: null, source: null };

class LicenseHint extends Component<void, Props, State> {
  props: Props;
  state = defaultState;

  componentWillReceiveProps(newProps: Props) {
    if (!newProps.properties || !newProps.properties.sourceId) {
      this.setState(defaultState);
      return;
    }
    dataSourceCache
      .getDataSourceWithId(newProps.properties.sourceId)
      .then(
        (source) => {
          this.setState({ source })
          return licenseCache.getLicenseWithId(source.licenseId);
        },
        () => { this.setState(defaultState); },
      ).then(
        license => this.setState({ license }),
        () => { this.setState(defaultState); },
      );
  }

  render() {
    const source = this.state.source;
    if (!source) return null;
    const license = this.state.license;
    if (!license) return null;
    return (<p className={this.props.className}>
      Source: {source.name} —
      <a href={license.websiteURL}>{license.shortName}</a>
    </p>);
  }
}


const StyledLicenseHint = styled(LicenseHint)`
  margin-top: .5em;
  font-size: 80%;
  opacity: 0.5;
`;


export default StyledLicenseHint;
