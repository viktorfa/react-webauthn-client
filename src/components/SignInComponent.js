import React, {Component} from 'react';
import _ from 'lodash';

import webAuthnConfig from "../webauthn/config";
import {ContentTypes, ServerSchemes} from "../webauthn/enums";
import {getCreateCredentialsOptions, getDecodedObject, getEncodedObject, getFetchOptions} from "../webauthn/utils";

class SignInComponent extends Component {
  constructor(props) {
    super(props);

    this.state = {
    };

    this.sendOptionsRequest = this.sendOptionsRequest.bind(this);
    this.generateSignInCredentials = this.generateSignInCredentials.bind(this);
    this.sendCredentialsToServer = this.sendCredentialsToServer.bind(this);
  }

  sendOptionsRequest() {
    const data = {
      username: this.props.username,
      displayName: this.props.username,
    };
    fetch(webAuthnConfig.authenicateChallengeEndpoint, getFetchOptions(data, ContentTypes.URLENCODED)).then((response) => {
      if (response.ok) return response.json();
      else throw new Error(response.statusText);
    }).then((data) => {
      console.log('server response options');
      console.log(data);
      this.setState({registerResponse: data.request.publicKeyCredentialRequestOptions});
      this.setState({requestId: data.request.requestId});
    }).catch(console.error);
  }

  generateSignInCredentials() {
    console.log('this.state.registerResponse');
    console.log(this.state.registerResponse);
    console.log('this.state.registerResponse decoded');
    console.log(getDecodedObject(this.state.registerResponse, ['challenge', 'allowCredentials[0].id']));
    navigator.credentials.get(getCreateCredentialsOptions(getDecodedObject(this.state.registerResponse, ['challenge', 'allowCredentials[0].id']))).then((credentials) => {
      console.log('Credentials from browser:');
      console.log(credentials);
      console.log('Credentials from browser _.toPlainObject(credentials):');
      console.log(_.toPlainObject(credentials));
      this.setState({publicKeyCredential: credentials});
      this.setState({publicKeyCredentialEncoded: getEncodedObject(credentials, ['response.authenticatorData', 'response.signature', 'response.clientDataJSON', 'rawId'])});
    }).catch(console.error);
  }

  sendCredentialsToServer() {
    console.log('this.state.publicKeyCredentialEncoded');
    console.log(this.state.publicKeyCredentialEncoded);
    let data;
    switch (webAuthnConfig.serverScheme) {
      case ServerSchemes.YUBICO:
        data = {
          credential: this.state.publicKeyCredentialEncoded,
          requestId: this.state.requestId,
        };
        break;
      default:
        data = this.state.publicKeyCredentialEncoded;
    }
    fetch(webAuthnConfig.authenticateResponseEndpoint, getFetchOptions(data, ContentTypes.JSON)).then((response) => {
      if (response.ok) return response.json();
      else throw new Error(response.statusText);
    }).then((data) => {
      console.log('sendCredentialsToServer response data');
      console.log(data);
      this.setState({registerCredentialResponse: data});
    }).catch(console.error);
  }

  render() {
    return (
      <div>
        <button
          onClick={this.sendOptionsRequest}
        >
          Ask server for options
        </button>
        <button
          onClick={this.generateSignInCredentials}
          disabled={!this.state.registerResponse}
        >
          Create credentials with options
        </button>
        <button
          onClick={this.sendCredentialsToServer}
          disabled={!this.state.publicKeyCredentialEncoded}
        >
          Send credentials to server
        </button>

        <div>
          <h4>this.props:</h4>
          <pre
            style={{textAlign: 'left'}}
          >
            {JSON.stringify(this.props, null, 2)}
          </pre>
          <h4>this.state:</h4>
          <pre
            style={{textAlign: 'left'}}
          >
            {JSON.stringify(this.state, null, 2)}
          </pre>
        </div>
      </div>
    );
  }
}


export default SignInComponent;
