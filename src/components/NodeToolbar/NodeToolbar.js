// @flow

import * as React from 'react';
import get from 'lodash/get';
import type { RouterHistory } from 'react-router-dom';
import styled from 'styled-components';

import Toolbar from '../Toolbar';
import CloseLink from '../CloseLink';
import NodeHeader from './NodeHeader';
import EditLinks from './EditLinks';
import StyledToolbar from './StyledToolbar';
import ExternalLinks from './ExternalLinks';
import ReportDialog from './Report/ReportDialog';
import PhotoSection from './Photos/PhotoSection';
import ShareButtons from './ShareButtons/ShareButtons';
import AccessibilityDetails from './AccessibilityDetails';
import AccessibleDescription from './AccessibleDescription';
import AccessibilityExtraInfo from './AccessibilityExtraInfo';
import EquipmentOverview from './Equipment/EquipmentOverview';
import EquipmentAccessibility from './EquipmentAccessibility';
import BasicPlaceAccessibility from './BasicPlaceAccessibility';
import AccessibilityEditor from './AccessibilityEditor/AccessibilityEditor';

import type { Feature } from '../../lib/Feature';
import type { Category } from '../../lib/Categories';
import { hasBigViewport } from '../../lib/ViewportSize';
import type { EquipmentInfo } from '../../lib/EquipmentInfo';
import filterAccessibility from '../../lib/filterAccessibility';
import { placeNameFor, isWheelmapFeatureId } from '../../lib/Feature';


const PositionedCloseLink = styled(CloseLink)`
  margin: -5px -16px -2px -2px; /* move close button to the same position as in search toolbar */
`;
PositionedCloseLink.displayName = 'PositionedCloseLink';


type Props = {
  feature: ?Feature,
  featureId: ?string | number,
  equipmentInfoId: ?string,
  hidden: boolean,
  isEditMode: boolean,
  isReportMode: boolean,
  onOpenReportMode: ?(() => void),
  history: RouterHistory,
  onClose?: ?(() => void),
  onClickCurrentMarkerIcon?: ((Feature) => void),

  // photo feature
  onStartPhotoUploadFlow: (() => void),
  photoFlowNotification?: string,
};


type State = {
  category: ?Category,
  parentCategory: ?Category,
  equipmentInfo: ?EquipmentInfo,
  feature: ?Feature,
};



class NodeToolbar extends React.Component<Props> {
  props: Props;

  toolbar: ?React.ElementRef<typeof Toolbar>;
  editLinks: ?React.ElementRef<typeof EditLinks>;
  reportDialog: ?React.ElementRef<typeof ReportDialog>;
  accessibilityEditor: ?React.ElementRef<typeof AccessibilityEditor>;
  shareButton: ?React.ElementRef<'button'>;
  reportModeButton: ?React.ElementRef<'button'>;

  shouldBeFocused: ?boolean;


  componentDidMount() {
    if (this.props.photoFlowNotification) {
      setTimeout(() => { if (this.toolbar) { this.toolbar.ensureFullVisibility(); }}, 200);
    }
  }


  componentDidUpdate(prevProps: Props, prevState: State) {
    // This variable temporarily indicates that the app wants the node toolbar to be focused, but the to be focused
    // element (the node toolbar's close link) was not rendered yet. See this.focus().
    if (this.shouldBeFocused) {
      this.focus();
    }

    this.manageFocus(prevProps, prevState);
  }


  focus() {
    const elementToFocus = this.editLinks || this.shareButton;
    if (elementToFocus) elementToFocus.focus();
    this.shouldBeFocused = !elementToFocus;
  }


  manageFocus(prevProps: Props, prevState: State) {
    // TODO: Re-integrate this into ExternalLinks
    // if (prevProps.isEditMode && !this.props.isEditMode) {
    //   if (this.editLinks) {
    //     this.editLinks.focus();
    //   } else if (this.shareButton) {
    //     this.shareButton.focus();
    //   }
    // }

    // if (prevProps.isReportMode && !this.props.isReportMode) {
    //   if (this.reportModeButton) {
    //     this.reportModeButton.focus();
    //   }
    // }
  }


  placeName() {
    return placeNameFor(get(this.props, 'feature.properties'), this.props.category);
  }


  isEquipment() {
    return !!this.props.equipmentInfoId;
  }


  renderReportDialog() {
    return (<ReportDialog
      innerRef={reportDialog => this.reportDialog = reportDialog}
      feature={this.props.feature}
      featureId={this.props.featureId}
      onClose={() => {
        if (this.props.onClose) this.props.onClose();
      }}
    />);
  }


  renderNodeHeader() {
    const {
      feature,
      equipmentInfo,
      equipmentInfoId,
      category,
      parentCategory,
      onClickCurrentMarkerIcon
    } = this.props;

    return <NodeHeader
      feature={feature}
      equipmentInfo={equipmentInfo}
      equipmentInfoId={equipmentInfoId}
      category={category}
      parentCategory={parentCategory}
      onClickCurrentMarkerIcon={onClickCurrentMarkerIcon}
      showOnlyBasics={this.props.isEditMode || this.props.isReportMode}
    />;
  }


  renderPhotoSection() {
    return <PhotoSection
      featureId={this.props.featureId}
      onStartPhotoUploadFlow={() => { this.props.onStartPhotoUploadFlow(); }}
      photoFlowNotification={this.props.photoFlowNotification}
    />;
  }


  renderEquipmentOverview() {
    const { history, feature, equipmentInfoId } = this.props;
    return <EquipmentOverview {...{ history, feature, equipmentInfoId }} />;
  }


  renderAccessibilitySection() {
    if (this.isEquipment()) {
      return <EquipmentAccessibility equipmentInfo={this.props.equipmentInfo} />
    }

    const properties = this.props.feature && this.props.feature.properties;
    const accessibility = properties && typeof properties.accessibility === 'object' ? properties.accessibility : null;
    const filteredAccessibility = accessibility ? filterAccessibility(accessibility) : null;

    const { featureId } = this.props;
    const isWheelmapFeature = isWheelmapFeatureId(featureId);
    const footer = isWheelmapFeature ? this.renderPhotoSection() : this.renderEquipmentOverview();

    return <React.Fragment>
      <BasicPlaceAccessibility properties={properties} />
      <AccessibleDescription properties={properties} />
      <AccessibilityDetails details={filteredAccessibility} />
      <AccessibilityExtraInfo properties={properties} />
      {footer}
    </React.Fragment>;
  }


  renderPlaceNameForEquipment() {
    const { featureId } = this.props;
    if (!featureId) return;

    return <a
      className="link-button"
      href={`/nodes/${featureId}`}
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        this.props.history.push(`/nodes/${featureId}`);
      }}
    >
      {this.placeName()}
    </a>;
  }


  renderEditLinks() {
    const { feature, featureId, category, parentCategory } = this.props;
    if (!featureId) return;
    return <EditLinks
      {...{ feature, featureId, category, parentCategory }}
      ref={editLinks => (this.editLinks = editLinks)}
    />
  }


  renderShareButtons() {
    const { feature, featureId, category, parentCategory } = this.props;
    return <ShareButtons
      {...{ feature, featureId, category, parentCategory }}
      innerRef={shareButton => this.shareButton = shareButton}
      onToggle={() => {
        if (this.toolbar) this.toolbar.ensureFullVisibility();
      }}
    />;
  }


  renderAllNodeDetails() {
    const { featureId, feature, equipmentInfoId, isReportMode, history } = this.props;

    if (!featureId) return;
    const isWheelmapFeature = isWheelmapFeatureId(featureId);
    return <div>
      {this.props.equipmentInfoId && featureId && this.renderPlaceNameForEquipment()}
      {this.renderAccessibilitySection()}
      {featureId && isWheelmapFeature && this.renderEditLinks()}
      <ExternalLinks {...{ featureId, feature, equipmentInfoId, isReportMode, history }} />
      {this.renderShareButtons()}
    </div>;
  }


  renderAccessibilityEditor() {
    const { featureId, feature } = this.props;
    return <AccessibilityEditor
      {...{ featureId, feature }}
      innerRef={accessibilityEditor => this.accessibilityEditor = accessibilityEditor}
      onClose={() => {
        if (featureId) {
          this.props.history.push(`/nodes/${featureId}`);
        }
      }}
    />;
  }


  renderContentBelowHeader() {
    const { featureId } = this.props;
    const isEquipment = this.isEquipment();

    if (this.props.isReportMode && !isEquipment) {
      return this.renderReportDialog();
    }

    if (this.props.isEditMode && featureId && !isEquipment) {
      return this.renderAccessibilityEditor();
    }

    return this.renderAllNodeDetails();
  }


  renderCloseLink() {
    const { history, onClose, isEditMode } = this.props;
    return isEditMode ? null : <PositionedCloseLink {...{ history, onClose }} />;
  }


  render() {
    return <StyledToolbar
      hidden={this.props.hidden}
      isModal={this.props.isEditMode || this.props.isReportMode}
      innerRef={(toolbar) => { this.toolbar = toolbar; }}
      role="dialog"
      ariaLabel={this.placeName()}
      startTopOffset={hasBigViewport() ? 0 : (0.4 * window.innerHeight)}
    >
      {this.renderCloseLink()}
      {this.renderNodeHeader()}
      {this.renderContentBelowHeader()}
    </StyledToolbar>;
  }
}

export default NodeToolbar;
