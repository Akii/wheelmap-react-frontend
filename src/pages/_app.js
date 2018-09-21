// @flow

// babel-preset-react-app uses useBuiltIn "entry". We therefore need an entry
// polyfill import to be replaced with polyfills we need for our targeted browsers.
import '@babel/polyfill';

import React from 'react';
import BaseApp, { Container } from 'next/app';
import Error from 'next/error';

import GlobalStyle from '../GlobalStyle';
import LeafletStyle from '../LeafletStyle';
import AppStyle from '../AppStyle';
import MapStyle from '../MapStyle';
import { parseAcceptLanguageString } from '../lib/i18n';
import router from '../app/router';
import {
  getInitialProps,
  getAppInitialProps,
  clientStoreAppInitialProps,
  clientStoreInitialProps,
  getHead,
} from '../app/getInitialProps';
import NextRouterHistory from '../lib/NextRouteHistory';

let isServer = false;

export default class App extends BaseApp {
  static async getInitialProps({
    Component: PageComponent,
    ctx,
  }: {
    Component: React.Component<>,
    ctx: any,
  }) {
    let appProps;
    let routeProps;

    isServer = !!(ctx && ctx.req);

    // handle 404 before the app is rendered, as we otherwise render the whole app again
    // this is very relevant for missing static files like translations
    if (isServer && ctx.res.statusCode >= 400) {
      const error = new Error('Could not load');
      error.statusCode = ctx.res.statusCode;
      return { error };
    }

    try {
      const userAgentString = isServer ? ctx.req.headers['user-agent'] : window.navigator.userAgent;

      const hostName: string = isServer
        ? ctx.req.headers.host.replace(/:.*$/, '')
        : window.location.hostname;

      // translations
      let languages = ['en'];

      if (ctx.req) {
        if (ctx.req.headers['accept-language']) {
          languages = parseAcceptLanguageString(ctx.req.headers['accept-language']);
        }
      } else {
        languages = [window.navigator.language]
          .concat(window.navigator.languages || [])
          .filter(Boolean);
      }

      if (!userAgentString) {
        return { error: new Error('User agent must be defined') };
      }

      if (!languages || languages.length === 0) {
        return { error: new Error('Missing languages.') };
      }

      appProps = await getAppInitialProps(
        { userAgentString, hostName, languages, ...ctx.query },
        isServer
      );

      if (ctx.query.routeName) {
        routeProps = await getInitialProps(ctx.query, isServer);
      }
    } catch (error) {
      console.error(error);

      if (ctx.res) {
        ctx.res.statusCode = error.statusCode || 500;
      }

      return { error };
    }

    return { ...appProps, ...routeProps, routeName: ctx.query.routeName };
  }

  constructor(props) {
    super(props);

    this.routerHistory = new NextRouterHistory(router);
  }

  render() {
    const { Component: PageComponent, error, routeName, ...props } = this.props;

    if (error && error.statusCode !== 404) {
      console.error('Error in _app.js', error);
    }

    if (!isServer) {
      clientStoreAppInitialProps(props);

      if (routeName) {
        clientStoreInitialProps(routeName, props);
      }
    }

    const head = routeName ? getHead(routeName, props) : null;

    return (
      <Container>
        {error ? (
          <div>
            {error.message}
            <Error statusCode={error.statusCode} />
          </div>
        ) : (
          <React.Fragment>
            {head}
            <PageComponent routerHistory={this.routerHistory} {...props} />
          </React.Fragment>
        )}
        <GlobalStyle />
        <LeafletStyle />
        <AppStyle />
        <MapStyle />
      </Container>
    );
  }
}
