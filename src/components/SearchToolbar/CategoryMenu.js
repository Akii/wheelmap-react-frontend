// @flow

import React from 'react';
import styled from 'styled-components';
import CategoryButton from './CategoryButton';
import { isFiltered } from '../../lib/Feature';
import Categories from '../../lib/Categories';
import type { YesNoLimitedUnknown, YesNoUnknown } from '../../lib/Feature';
import type { RouterHistory } from 'react-router-dom';

const Container = styled.div`
  flex-flow: row wrap;
  display: flex;
  z-index: 1000;
  top: 50px;
  width: 100%;
  padding: 0;
  > .category-button {
    flex: 80px;
    @media (max-width: 512px) {
      flex: 60px;
    }
    @media (max-width: 320px) {
      flex: 50px;
      .circle {
        height: 30px;
        width: 30px;
      }
      figure {
        width: 30px;
        height: 30px;
        svg.icon {
          width: 18px;
          height: 18px;
        }
      }
    }
  }
`;

type Props = {
  hidden: boolean,
  onFocus: () => void,
  onBlur: () => void,
  categories: string[],
  category: ?string,
  accessibilityFilter?: YesNoLimitedUnknown[],
  toiletFilter?: YesNoUnknown[],
  history: RouterHistory,
};

export default function CategoryMenu(props: Props) {
  let names = null;
  if (props.category) {
    names = { [props.category]: Categories.translatedWheelmapRootCategoryName(props.category) };
  } else {
    names = Categories.getTranslatedRootCategoryNames();
    const foo = props.categories.reduce((memo, element) => {
      memo[element] = names[Categories.wheelmapRootCategoryNameForACParentCategoryName(element)];
      return memo;
    }, {});

    names = foo;
  }
  const showCloseButton = Boolean(props.category);

  // debugger; //eslint-disable-line

  return (
    <Container className="category-menu">
      {Object.keys(names).map((category, index) => (
        <CategoryButton
          hidden={props.hidden}
          history={props.history}
          onFocus={props.onFocus}
          showCloseButton={showCloseButton}
          hasCircle={!showCloseButton && !isFiltered(props.accessibilityFilter)}
          accessibilityFilter={props.accessibilityFilter}
          toiletFilter={props.toiletFilter}
          key={category}
          className="category-button"
          name={names[category]}
          category={category}
        />
      ))}
    </Container>
  );
}
