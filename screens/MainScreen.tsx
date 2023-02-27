import React, {useState} from 'react';
import {ScrollView, StyleSheet} from 'react-native';
import {Appbar, Divider, Portal} from 'react-native-paper';

import AccountInfo from '../components/AccountInfo';
import CreateUserButton from '../components/CreateUserButton';
import useAuthorization from '../utils/useAuthorization';

export default function MainScreen() {
  const {accounts, onChangeAccount, selectedAccount} = useAuthorization();
  const [memoText, setMemoText] = useState('');
  return (
    <>
      <Appbar.Header elevated mode="center-aligned">
        <Appbar.Content title="Gum React Native Test" />
      </Appbar.Header>
      <Portal.Host>
        <ScrollView contentContainerStyle={styles.container}>
          <Divider style={styles.spacer} />
          <CreateUserButton>Create User</CreateUserButton>
        </ScrollView>
        {accounts && selectedAccount ? (
          <AccountInfo
            accounts={accounts}
            onChange={onChangeAccount}
            selectedAccount={selectedAccount}
          />
        ) : null}
      </Portal.Host>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  shell: {
    height: '100%',
  },
  spacer: {
    marginVertical: 16,
    width: '100%',
  },
  textInput: {
    width: '100%',
  },
});