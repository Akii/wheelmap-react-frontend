// @flow

import styled from 'styled-components';
import * as React from 'react';
import colors from '../../../lib/colors';
import { t } from 'c-3po';
import CheckmarkIcon from '../../icons/actions/CheckmarkIcon';
import ProblemIcon from '../../icons/actions/ProblemIcon';

type Props = {
  className: string;
  notificationType?: 'uploadProgress' | 'uploadFailed' | 'reported' | 'waitingForReview';
  uploadProgress?: number // between 0 and 100
  ; };

type State = {};

const defaultState: State = {};

const StyledCheckmarkIcon = styled(CheckmarkIcon)`
  path { 
    fill: ${props => props.color};
  }
`;

const StyledProblemIcon = styled(ProblemIcon)`
  path { 
    stroke: ${props => props.color};
  }
  circle {
    fill: ${props => props.color};
  } 
`;

class PhotoNotification extends React.Component<Props, State> {
  props: Props;
  state: State = defaultState;

  componentDidMount() {}

  componentWillReceiveProps(newProps: Props) {}

  render() {
    const { className, notificationType, uploadProgress } = this.props;
    const usedType = notificationType || 'none';

    const notificationComponents = {
      uploadProgress: <small>
          <progress max={100} value={uploadProgress || 0} />
          {t`Lade hoch…`}
        </small>,
      uploadFailed: <small>
          <StyledProblemIcon color={colors.negativeColor} />
          {t`Upload-Fehler: Serverfehler oder Dateiformat nicht unterstützt`}
        </small>,
      reported: <small>
          <StyledCheckmarkIcon color={colors.negativeColor} />
          {t`Danke, dass du das Foto gemeldet hast! Wir sehen uns das an.`}
        </small>,
      waitingForReview: <small>
          <StyledCheckmarkIcon color={colors.primaryColorBrighter} />
          {t`Danke für deine Mithilfe! Dein Beitrag ist in Kürze auch für andere sichtbar.`}
        </small>,
      none: null
    };

    return <div className={`${className} notification-mode-${usedType}`}>
        {notificationComponents[usedType]}
      </div>;
  }
}

const StyledPhotoNotification = styled(PhotoNotification)`
  position: relative;
  margin: 0px -6px 0px -6px;
  padding: 8px;
  border-radius: 0 0 4px 4px;
  background: ${colors.coldBackgroundColor};

  &.notification-mode-uploadFailed,
  &.notification-mode-waitingForReview,
  &.notification-mode-reported {

    small {
      display: flex;
      justify-content: space-between;
      align-items: center;
  
      > svg {
        font-size: 3rem;
        min-width: 34px;
        margin: -1rem 0;
        margin-right: 8px;
      }
    }
  }
  
  &.notification-mode-uploadFailed,
  &.notification-mode-reported {
    color: ${colors.negativeColor};
    background: ${colors.negativeBackgroundColorTransparent};
  }

  &.notification-mode-uploadProgress {
    progress {
      margin-right: 1rem;
    }
  }
  
  &.notification-mode-uploadFailed {
    small > svg {
      font-size: 2rem;
    }
  }
  
  &.notification-mode-waitingForReview,
  &.notification-mode-reported {
    small > svg {
      font-size: 3rem;
    }
  }
`;

export default StyledPhotoNotification;