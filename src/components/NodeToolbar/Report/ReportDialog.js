// @flow
import * as React from 'react';
import styled from 'styled-components';
import {
  accessibilityName,
  isWheelchairAccessible,
  isWheelmapFeatureId,
} from '../../../lib/Feature';

import { t } from 'c-3po';
import type { Feature, NodeProperties } from '../../../lib/Feature';

import strings from './strings';
import FixComment from './FixComment';
import MailToSupport from './MailToSupport';
import FixPlacePosition from './FixPlacePosition';
import FixOnExternalPage from './FixOnExternalPage';
import FixNonExistingPlace from './FixNonExistingPlace';
import WheelchairStatusEditor from '../AccessibilityEditor/WheelchairStatusEditor';
import ToiletStatusEditor from '../AccessibilityEditor/ToiletStatusEditor';


type IssueEntry = { className: string, issueText: () => string, component: Class<React.Component<any>> };

const generateIssues = (properties: NodeProperties) : IssueEntry[] => [
  {
    className: 'wrong-wheelchair-accessibility',
    issueText() {
      const accessibilityDescription = accessibilityName(isWheelchairAccessible(properties)) || '';
      // translator: Shown as issue description in the report dialog
      return t`The place is marked as ‘${accessibilityDescription}’, but this is wrong!`;
    },
    component: WheelchairStatusEditor,
  },
  (isWheelchairAccessible(properties) !== 'unknown') ? {
    className: 'wrong-toilet-accessibility',
    // translator: Shown as issue description in the report dialog
    issueText: () => t`The place’s toilet status is wrong or missing.`,
    component: ToiletStatusEditor,
  } : null,
  {
    className: 'information-missing',
    // translator: Shown as issue description in the report dialog
    issueText: () => t`I have more information about this place.`,
    component: FixComment,
  },
  {
    className: 'non-existing-place',
    // translator: Shown as issue description in the report dialog
    issueText: () => t`The place does not exist.`,
    component: FixNonExistingPlace,
  },
  {
    className: 'wrong-position',
    // translator: Shown as issue description in the report dialog
    issueText: () => t`The place is in the wrong position.`,
    component: FixPlacePosition,
  },
  {
    className: 'other-issue',
    // translator: Shown as issue description in the report dialog
    issueText: () => t`My problem isn’t listed here…`,
    component: MailToSupport,
  },
].filter(Boolean);


type Props = {
  feature: Feature,
  featureId: string | number | null,
  className: string,
  onClose: (() => void),
  onCloseButtonChanged: (() => void),
  onReportComponentChanged: (() => void),
};

type State = {
  SelectedComponentClass: ?Class<React.Component<*, *>>,
};

class ReportDialog extends React.Component<Props, State> {
  props: Props;

  state = {
    SelectedComponentClass: null,
  };

  backButton: HTMLButtonElement | null;
  firstIssueButton: HTMLButtonElement | null;

  componentDidMount() {
    document.addEventListener('keydown', this.escapeHandler);
    if (this.firstIssueButton) {
      this.firstIssueButton.focus();
    }
  }

  componentWillUnmount() {
    document.removeEventListener('keydown', this.escapeHandler);
  }

  componentWillReceiveProps(newProps: Props) {
    if (newProps.featureId !== this.props.featureId) {
      this.setState({ SelectedComponentClass: null });
    }
    if (!isWheelmapFeatureId(newProps.featureId)) {
      this.setState({ SelectedComponentClass: FixOnExternalPage });
    }
  }

  escapeHandler = (event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      this.props.onClose();
      event.preventDefault();
      event.stopPropagation();
    }
  }

  trapFocus = ({nativeEvent}) => {
    if (nativeEvent.target === this.firstIssueButton && nativeEvent.key === 'Tab' && nativeEvent.shiftKey) {
      nativeEvent.preventDefault();
      if (this.backButton) {
        this.backButton.focus();
      }
    }
    if (nativeEvent.target === this.backButton && nativeEvent.key === 'Tab' && !nativeEvent.shiftKey) {
      nativeEvent.preventDefault();
      if (this.firstIssueButton) {
        this.firstIssueButton.focus();
      }
    }
  }

  onClose = (event: ?UIEvent) => {
    if (this.props.onClose) {
      this.props.onClose();
      if (event) {
        event.preventDefault();
        event.stopPropagation();
      }
    }
  }

  onSelectComponentClass = (issue: IssueEntry, event: UIEvent) => {
    this.setState({ SelectedComponentClass: issue.component }, this.props.onReportComponentChanged);
    event.stopPropagation();
    event.preventDefault();
  }

  render() {
    const { featureId, feature } = this.props;
    if (!featureId || !feature || !feature.properties) return null;

    const ComponentClass = this.state.SelectedComponentClass;
    const { backButtonCaption, reportIssueHeader } = strings();

    const properties : NodeProperties = feature.properties;
    const issues = generateIssues(properties);

    if (ComponentClass) {
      return (<ComponentClass
        feature={feature}
        featureId={featureId}
        onClose={this.onClose}
        inline={true}
      />);
    }

    return (
      <div
        className={this.props.className}
        role="dialog"
        aria-labelledby="report-dialog-header"
      >
        <header id='report-dialog-header'>{reportIssueHeader}</header>

        <ul className="issue-types">
          {issues.map((issue, index) => (
            <li key={issue.className} className={issue.className}>
              <button
                className={`link-button full-width-button ${issue.className}`}
                ref={firstIssueButton => {
                  if(index === 0) {
                    this.firstIssueButton = firstIssueButton
                  }
                }}
                onClick={this.onSelectComponentClass.bind(this, issue)}
                onKeyDown={this.trapFocus}
              >
                {issue.issueText()}
              </button>
            </li>
          ))}
        </ul>

        <button
          className="link-button negative-button"
          ref={backButton => this.backButton = backButton}
          onClick={this.onClose}
          onKeyDown={this.trapFocus}
        >
          {backButtonCaption}
        </button>
    </div>);
  }
}


const StyledReportDialog = styled(ReportDialog)`
  header {
    margin-bottom: 0.5em;
  }
  ul.issue-types {
    margin: 0;
    padding: 0;
    list-style-type: none;
  }
`;

export default StyledReportDialog;
