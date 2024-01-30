import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import sinon from 'sinon';
import { NetworkStatus } from '@metamask/network-controller';
import { NetworkType } from '@metamask/controller-utils';
import { TransactionStatus } from '@metamask/transaction-controller';
import { SET_DETAILS_FOR_CONFIRM_TX } from '../../pages/send/send.constants';
import { AssetType } from '../../../shared/constants/transaction';
import { updateTransaction } from '../../store/actions';
import { AMOUNT_MODES } from '../send';
import { getGasEstimationObject, getSelectedAccount } from '../../selectors';
import { getMaximumGasTotalInHexWei } from '../../../shared/modules/gas.utils';

import ConfirmTransactionReducer, * as actions from './confirm-transaction.duck';

const initialState = {
  txData: {},
  tokenData: {},
  tokenProps: {},
  fiatTransactionAmount: '',
  fiatTransactionFee: '',
  fiatTransactionTotal: '',
  ethTransactionAmount: '',
  ethTransactionFee: '',
  ethTransactionTotal: '',
  hexTransactionAmount: '',
  hexTransactionFee: '',
  hexTransactionTotal: '',
  nonce: '',
  sendTxDetailPerId: {},
};

const UPDATE_TX_DATA = 'metamask/confirm-transaction/UPDATE_TX_DATA';
const UPDATE_TOKEN_DATA = 'metamask/confirm-transaction/UPDATE_TOKEN_DATA';
const UPDATE_TRANSACTION_AMOUNTS =
  'metamask/confirm-transaction/UPDATE_TRANSACTION_AMOUNTS';
const UPDATE_TRANSACTION_FEES =
  'metamask/confirm-transaction/UPDATE_TRANSACTION_FEES';
const UPDATE_TRANSACTION_TOTALS =
  'metamask/confirm-transaction/UPDATE_TRANSACTION_TOTALS';
const UPDATE_NONCE = 'metamask/confirm-transaction/UPDATE_NONCE';
const CLEAR_CONFIRM_TRANSACTION =
  'metamask/confirm-transaction/CLEAR_CONFIRM_TRANSACTION';

jest.mock('../../store/actions', () => ({
  updateTransaction: jest.fn(),
}));

jest.mock('../../../shared/modules/gas.utils', () => ({
  getMaximumGasTotalInHexWei: jest.fn(),
}));

jest.mock('../../selectors', () => ({
  ...jest.requireActual('../../selectors/confirm'),
  ...jest.requireActual('../../selectors/confirm-transaction'),
  ...jest.requireActual('../../selectors/custom-gas'),
  ...jest.requireActual('../../selectors/first-time-flow'),
  ...jest.requireActual('../../selectors/metametrics'),
  ...jest.requireActual('../../selectors/permissions'),
  ...jest.requireActual('../../selectors/selectors'),
  ...jest.requireActual('../../selectors/transactions'),
  ...jest.requireActual('../../selectors/approvals'),
  getSelectedAccount: jest.fn(),
  getGasEstimationObject: jest.fn(),
}));

describe('Confirm Transaction Duck', () => {
  describe('State changes', () => {
    const mockState = {
      txData: {
        id: 1,
      },
      tokenData: {
        name: 'abcToken',
      },
      fiatTransactionAmount: '469.26',
      fiatTransactionFee: '0.01',
      fiatTransactionTotal: '1.000021',
      ethTransactionAmount: '1',
      ethTransactionFee: '0.000021',
      ethTransactionTotal: '469.27',
      hexTransactionAmount: '',
      hexTransactionFee: '0x1319718a5000',
      hexTransactionTotal: '',
      nonce: '0x0',
      sendTxDetailPerId: {},
    };

    it('should initialize state', () => {
      expect(ConfirmTransactionReducer(undefined, {})).toStrictEqual(
        initialState,
      );
    });

    it('should return state unchanged if it does not match a dispatched actions type', () => {
      expect(
        ConfirmTransactionReducer(mockState, {
          type: 'someOtherAction',
          value: 'someValue',
        }),
      ).toStrictEqual({ ...mockState });
    });

    it('should set txData when receiving a UPDATE_TX_DATA action', () => {
      expect(
        ConfirmTransactionReducer(mockState, {
          type: UPDATE_TX_DATA,
          payload: {
            id: 2,
          },
        }),
      ).toStrictEqual({
        ...mockState,
        txData: {
          ...mockState.txData,
          id: 2,
        },
      });
    });

    it('should set tokenData when receiving a UPDATE_TOKEN_DATA action', () => {
      expect(
        ConfirmTransactionReducer(mockState, {
          type: UPDATE_TOKEN_DATA,
          payload: {
            name: 'defToken',
          },
        }),
      ).toStrictEqual({
        ...mockState,
        tokenData: {
          ...mockState.tokenData,
          name: 'defToken',
        },
      });
    });

    it('should update transaction amounts when receiving an UPDATE_TRANSACTION_AMOUNTS action', () => {
      expect(
        ConfirmTransactionReducer(mockState, {
          type: UPDATE_TRANSACTION_AMOUNTS,
          payload: {
            fiatTransactionAmount: '123.45',
            ethTransactionAmount: '.5',
            hexTransactionAmount: '0x1',
          },
        }),
      ).toStrictEqual({
        ...mockState,
        fiatTransactionAmount: '123.45',
        ethTransactionAmount: '.5',
        hexTransactionAmount: '0x1',
      });
    });

    it('should update transaction fees when receiving an UPDATE_TRANSACTION_FEES action', () => {
      expect(
        ConfirmTransactionReducer(mockState, {
          type: UPDATE_TRANSACTION_FEES,
          payload: {
            fiatTransactionFee: '123.45',
            ethTransactionFee: '.5',
            hexTransactionFee: '0x1',
          },
        }),
      ).toStrictEqual({
        ...mockState,
        fiatTransactionFee: '123.45',
        ethTransactionFee: '.5',
        hexTransactionFee: '0x1',
      });
    });

    it('should update transaction totals when receiving an UPDATE_TRANSACTION_TOTALS action', () => {
      expect(
        ConfirmTransactionReducer(mockState, {
          type: UPDATE_TRANSACTION_TOTALS,
          payload: {
            fiatTransactionTotal: '123.45',
            ethTransactionTotal: '.5',
            hexTransactionTotal: '0x1',
          },
        }),
      ).toStrictEqual({
        ...mockState,
        fiatTransactionTotal: '123.45',
        ethTransactionTotal: '.5',
        hexTransactionTotal: '0x1',
      });
    });

    it('should update nonce when receiving an UPDATE_NONCE action', () => {
      expect(
        ConfirmTransactionReducer(mockState, {
          type: UPDATE_NONCE,
          payload: '0x1',
        }),
      ).toStrictEqual({
        ...mockState,
        nonce: '0x1',
      });
    });

    it('should clear confirmTransaction when receiving a FETCH_DATA_END action', () => {
      expect(
        ConfirmTransactionReducer(mockState, {
          type: CLEAR_CONFIRM_TRANSACTION,
        }),
      ).toStrictEqual(initialState);
    });

    it('should set amountMode and assetType when receiving a SET_DETAILS_FOR_CONFIRM_TX action', () => {
      const mockTransactionId = 'mockTransactionId';
      const mockAmountMode = 'MAX';
      const mockAssetType = 'native';
      expect(
        ConfirmTransactionReducer(mockState, {
          type: SET_DETAILS_FOR_CONFIRM_TX,
          payload: {
            transactionId: mockTransactionId,
            amountMode: mockAmountMode,
            assetType: mockAssetType,
          },
        }),
      ).toStrictEqual({
        ...mockState,
        sendTxDetailPerId: {
          [mockTransactionId]: {
            amountMode: mockAmountMode,
            assetType: mockAssetType,
          },
        },
      });
    });

    it('should preserve sendTxDetailPerId', () => {
      const stateToPreserve = {
        sendTxDetailPerId: {
          mockTransactionId: {
            amountMode: 'mockAmountMode',
            assetType: 'native',
          },
        },
      };
      const preservedState = {
        ...mockState,
        ...stateToPreserve,
      };
      expect(
        ConfirmTransactionReducer(preservedState, {
          type: CLEAR_CONFIRM_TRANSACTION,
        }),
      ).toStrictEqual({
        ...initialState,
        ...stateToPreserve,
      });
    });
  });

  describe('Single actions', function () {
    it('should create an action to update txData', function () {
      const txData = { test: 123 };
      const expectedAction = {
        type: UPDATE_TX_DATA,
        payload: txData,
      };

      expect(actions.updateTxData(txData)).toStrictEqual(expectedAction);
    });

    it('should create an action to update tokenData', function () {
      const tokenData = { test: 123 };
      const expectedAction = {
        type: UPDATE_TOKEN_DATA,
        payload: tokenData,
      };

      expect(actions.updateTokenData(tokenData)).toStrictEqual(expectedAction);
    });

    it('should create an action to update transaction amounts', function () {
      const transactionAmounts = { test: 123 };
      const expectedAction = {
        type: UPDATE_TRANSACTION_AMOUNTS,
        payload: transactionAmounts,
      };

      expect(
        actions.updateTransactionAmounts(transactionAmounts),
      ).toStrictEqual(expectedAction);
    });

    it('should create an action to update transaction fees', function () {
      const transactionFees = { test: 123 };
      const expectedAction = {
        type: UPDATE_TRANSACTION_FEES,
        payload: transactionFees,
      };

      expect(actions.updateTransactionFees(transactionFees)).toStrictEqual(
        expectedAction,
      );
    });

    it('should create an action to update transaction totals', function () {
      const transactionTotals = { test: 123 };
      const expectedAction = {
        type: UPDATE_TRANSACTION_TOTALS,
        payload: transactionTotals,
      };

      expect(actions.updateTransactionTotals(transactionTotals)).toStrictEqual(
        expectedAction,
      );
    });

    it('should create an action to update nonce', function () {
      const nonce = '0x1';
      const expectedAction = {
        type: UPDATE_NONCE,
        payload: nonce,
      };

      expect(actions.updateNonce(nonce)).toStrictEqual(expectedAction);
    });

    it('should create an action to clear confirmTransaction', () => {
      const expectedAction = {
        type: CLEAR_CONFIRM_TRANSACTION,
      };

      expect(actions.clearConfirmTransaction()).toStrictEqual(expectedAction);
    });
  });

  describe('Thunk actions', () => {
    beforeEach(() => {
      global.eth = {
        getCode: sinon
          .stub()
          .callsFake((address) =>
            Promise.resolve(address?.match(/isContract/u) ? 'not-0x' : '0x'),
          ),
      };
    });

    afterEach(function () {
      global.eth.getCode.resetHistory();
    });

    it('updates txData and updates gas values in confirmTransaction', () => {
      const txData = {
        history: [],
        id: 2603411941761054,
        loadingDefaults: false,
        chainId: '0x5',
        origin: 'faucet.metamask.io',
        status: TransactionStatus.unapproved,
        time: 1530838113716,
        txParams: {
          from: '0xc5ae6383e126f901dcb06131d97a88745bfa88d6',
          gas: '0x33450',
          gasPrice: '0x2540be400',
          to: '0x81b7e08f65bdf5648606c89998a9cc8164397647',
          value: '0xde0b6b3a7640000',
        },
      };
      const mockState = {
        metamask: {
          currentCurrency: 'usd',
          currencyRates: {
            ETH: {
              conversionRate: 468.58,
            },
          },
          providerConfig: {
            ticker: 'ETH',
          },
        },
        confirmTransaction: {
          ethTransactionAmount: '1',
          ethTransactionFee: '0.000021',
          ethTransactionTotal: '1.000021',
          fetchingData: false,
          fiatTransactionAmount: '469.26',
          fiatTransactionFee: '0.01',
          fiatTransactionTotal: '469.27',
          hexGasTotal: '0x1319718a5000',
          methodData: {},
          nonce: '',
          tokenData: {},
          tokenProps: {
            decimals: '',
            symbol: '',
          },
          txData: {
            ...txData,
            txParams: {
              ...txData.txParams,
            },
          },
        },
      };

      const middlewares = [thunk];
      const mockStore = configureMockStore(middlewares);
      const store = mockStore(mockState);
      const expectedActions = [
        'metamask/confirm-transaction/UPDATE_TX_DATA',
        'metamask/confirm-transaction/UPDATE_TRANSACTION_AMOUNTS',
        'metamask/confirm-transaction/UPDATE_TRANSACTION_FEES',
        'metamask/confirm-transaction/UPDATE_TRANSACTION_TOTALS',
      ];

      store.dispatch(actions.updateTxDataAndCalculate(txData));

      const storeActions = store.getActions();
      expect(storeActions).toHaveLength(expectedActions.length);
      storeActions.forEach((action, index) =>
        expect(action.type).toStrictEqual(expectedActions[index]),
      );
    });

    it('updates confirmTransaction transaction', () => {
      const mockState = {
        metamask: {
          currentCurrency: 'usd',
          currencyRates: {
            ETH: {
              conversionRate: 468.58,
            },
          },
          selectedNetworkClientId: NetworkType.goerli,
          networksMetadata: {
            [NetworkType.goerli]: {
              EIPS: {},
              status: NetworkStatus.Available,
            },
          },
          providerConfig: {
            chainId: '0x5',
            ticker: 'ETH',
          },
          transactions: [
            {
              history: [],
              id: 2603411941761054,
              loadingDefaults: false,
              chainId: '0x5',
              origin: 'faucet.metamask.io',
              status: TransactionStatus.unapproved,
              time: 1530838113716,
              txParams: {
                from: '0xc5ae6383e126f901dcb06131d97a88745bfa88d6',
                gas: '0x33450',
                gasPrice: '0x2540be400',
                to: '0x81b7e08f65bdf5648606c89998a9cc8164397647',
                value: '0xde0b6b3a7640000',
              },
            },
          ],
        },
        confirmTransaction: {},
      };
      const middlewares = [thunk];
      const mockStore = configureMockStore(middlewares);
      const store = mockStore(mockState);
      const expectedActions = [
        'metamask/confirm-transaction/UPDATE_TX_DATA',
        'metamask/confirm-transaction/UPDATE_TRANSACTION_AMOUNTS',
        'metamask/confirm-transaction/UPDATE_TRANSACTION_FEES',
        'metamask/confirm-transaction/UPDATE_TRANSACTION_TOTALS',
      ];

      store.dispatch(actions.setTransactionToConfirm(2603411941761054));
      const storeActions = store.getActions();
      expect(storeActions).toHaveLength(expectedActions.length);

      storeActions.forEach((action, index) =>
        expect(action.type).toStrictEqual(expectedActions[index]),
      );
    });
  });

  describe('updateTxValueIfMaxEthSettled', () => {
    const mockDispatch = jest.fn();
    const mockGetState = jest.fn();
    const mockGasFeeEstimates = {};
    const mockGasEstimateType = '';

    afterEach(() => {
      jest.clearAllMocks();
    });

    it('should not update transaction if amountMode is not MAX', () => {
      const mockState = {
        confirmTransaction: {
          txData: {
            id: '1',
          },
          sendTxDetailPerId: {
            1: {
              amountMode: AMOUNT_MODES.INPUT,
              assetType: AssetType.native,
            },
          },
        },
      };
      mockGetState.mockReturnValue(mockState);

      actions.updateTxValueIfMaxEthSettled(mockDispatch, mockGetState, {
        mockGasFeeEstimates,
        mockGasEstimateType,
      });

      expect(updateTransaction).not.toHaveBeenCalled();
    });

    it('should not update transaction if assetType is not native', () => {
      const mockState = {
        confirmTransaction: {
          txData: {
            id: '1',
          },
          sendTxDetailPerId: {
            1: {
              amountMode: AMOUNT_MODES.MAX,
              assetType: AssetType.token,
            },
          },
        },
      };
      mockGetState.mockReturnValue(mockState);

      actions.updateTxValueIfMaxEthSettled(mockDispatch, mockGetState, {
        mockGasFeeEstimates,
        mockGasEstimateType,
      });

      expect(updateTransaction).not.toHaveBeenCalled();
    });

    it('should update transaction if amountMode is MAX and assetType is native', () => {
      const mockState = {
        confirmTransaction: {
          txData: {
            id: '1',
            txParams: {
              value: '0x3b6', // 950 in hex
            },
          },
          sendTxDetailPerId: {
            1: {
              amountMode: AMOUNT_MODES.MAX,
              assetType: AssetType.native,
            },
          },
        },
      };

      const mockBalance = '0x3e8'; // 1000 in hex

      const mockGasEstimationObject = {
        gasLimit: '0x5208',
        gasPrice: '0x3b9aca00',
      };

      getSelectedAccount.mockReturnValueOnce({
        balance: mockBalance,
      });
      getGasEstimationObject.mockReturnValueOnce(mockGasEstimationObject);
      getMaximumGasTotalInHexWei.mockReturnValueOnce('0x64'); // 100 in hex

      const curryUpdateTransactionMock = jest.fn();
      updateTransaction.mockImplementationOnce(
        () => curryUpdateTransactionMock,
      );

      actions.updateTxValueIfMaxEthSettled(mockDispatch, mockState, {
        mockGasFeeEstimates,
        mockGasEstimateType,
      });

      expect(updateTransaction).toHaveBeenCalled();
      expect(updateTransaction).toHaveBeenCalledWith(
        {
          id: '1',
          txParams: { value: '0x384' }, // 900 in hex - updated value
        },
        true,
      );
      expect(curryUpdateTransactionMock).toHaveBeenCalledWith(mockDispatch, {
        confirmTransaction: {
          sendTxDetailPerId: { 1: { amountMode: 'MAX', assetType: 'NATIVE' } },
          txData: { id: '1', txParams: { value: '0x3b6' } }, // 950 in hex - original value
        },
      });
    });
  });
});
