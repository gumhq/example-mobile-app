import {AnchorWallet, useAnchorWallet, useConnection} from '@solana/wallet-adapter-react';
import {transact} from '@solana-mobile/mobile-wallet-adapter-protocol-web3js';
import React, {useContext, useState} from 'react';
import {Linking, StyleSheet, View} from 'react-native';
import {
  Button,
  Dialog,
  IconButton,
  Paragraph,
  Portal,
} from 'react-native-paper';
import { useGum, useCreateUser } from '@gumhq/react-sdk';

import useAuthorization from '../utils/useAuthorization';
import useGuardedCallback from '../utils/useGuardedCallback';
import {SnackbarContext} from './SnackbarProvider';
import { Keypair, Transaction } from '@solana/web3.js';

type Props = Readonly<{
  children?: React.ReactNode;
}>;

export default function CreateUserButton({ children }: Props) {
  const {authorizeSession, selectedAccount} = useAuthorization();
  const {connection} = useConnection();
  const [recordMessageTutorialOpen, setRecordMessageTutorialOpen] = useState(false);
  const [recordingInProgress, setRecordingInProgress] = useState(false);
  const keypair = Keypair.generate();

  const anchorWallet = {
    publicKey: keypair.publicKey,
    signTransaction: async (transaction: Transaction) => {
      transaction.sign(keypair);
      return transaction
    },
    signAllTransactions: async (transactions: Transaction[]) => {
      transactions.map((transaction) => {
        return transaction.sign(keypair);
      });
      return transactions;
    }
  };

  const sdk = useGum(
    anchorWallet,
    connection,
    { preflightCommitment: "confirmed" },
    "devnet"
  );

  const { createUserIxMethodBuilder, error, loading } = useCreateUser(sdk!);

  const createUserGuarded = useGuardedCallback(
    async (): Promise<void> => {
      await transact(async (wallet) => {
        const [freshAccount, latestBlockhash] = await Promise.all([
          authorizeSession(wallet),
          connection.getLatestBlockhash(),
        ]);
        const owner = selectedAccount?.publicKey ?? freshAccount.publicKey;
        const createUserIx = await createUserIxMethodBuilder(owner);
        const transaction = await  createUserIx?.transaction();
        if (!transaction) {
          console.log('No transaction!');
          return;
        }
        const signature = await wallet.signAndSendTransactions({
          transactions: [transaction]
        });
        console.log('Transaction Signature', signature);
      });
    },
    [authorizeSession, connection, selectedAccount],
  );

  return (
    <>
      <View style={styles.buttonGroup}>
        <Button
          loading={recordingInProgress}
          onPress={async () => {
            if (recordingInProgress) {
              return;
            }
            setRecordingInProgress(true);
            try {
              await createUserGuarded();
            } finally {
              setRecordingInProgress(false);
            }
          }}
          mode="contained"
          style={styles.actionButton}>
          {children}
        </Button>
        <IconButton
          icon="help"
          mode="outlined"
          onPress={() => {
            setRecordMessageTutorialOpen(true);
          }}
          style={styles.infoButton}
        />
      </View>
      <Portal>
        <Dialog
          onDismiss={() => {
            setRecordMessageTutorialOpen(false);
          }}
          visible={recordMessageTutorialOpen}>
          <Dialog.Content>
            <Paragraph>
              Clicking &ldquo;Record&rdquo; will send a transaction that creates a user account on the Gum program.
            </Paragraph>
            <Dialog.Actions>
              <Button
                onPress={() => {
                  setRecordMessageTutorialOpen(false);
                }}>
                Got it
              </Button>
            </Dialog.Actions>
          </Dialog.Content>
        </Dialog>
      </Portal>
    </>
  );
}

const styles = StyleSheet.create({
  actionButton: {
    flex: 1,
    marginEnd: 8,
  },
  infoButton: {
    margin: 0,
  },
  buttonGroup: {
    display: 'flex',
    flexDirection: 'row',
    width: '100%',
  },
});
