import { addHexPrefix } from 'ethereumjs-util';
import { cloneDeep } from 'lodash';
import {
  conversionRateSelector,
  currentCurrencySelector,
  unconfirmedTransactionsHashSelector,
  getSelectedAccount,
} from '../../selectors';
import { getNativeCurrency, getTokens } from '../metamask/metamask';

import {
  getTransactionFee,
  getHexGasTotal,
  addFiat,
  addEth,
} from '../../helpers/utils/confirm-tx.util';

import {
  getValueFromWeiHex,
  hexToDecimal,
  sumHexes,
} from '../../../shared/modules/conversion.utils';
import { getAveragePriceEstimateInHexWEI } from '../../selectors/custom-gas';
import { isEqualCaseInsensitive } from '../../../shared/modules/string-utils';
import { Numeric } from '../../../shared/modules/Numeric';
import { parseStandardTokenTransactionData } from '../../../shared/modules/transaction.utils';
import { getGasEstimationObject } from '../../selectors/confirm-transaction';
import { updateTransaction } from '../../store/actions';
import { getMaximumGasTotalInHexWei } from '../../../shared/modules/gas.utils';
import { AMOUNT_MODES } from '../../ducks/send';
import * as actionConstants from '../../store/actionConstants';
import { AssetType } from '../../../shared/constants/transaction';

// Actions
const createActionType = (action) => `metamask/confirm-transaction/${action}`;

const UPDATE_TX_DATA = createActionType('UPDATE_TX_DATA');
const UPDATE_TOKEN_DATA = createActionType('UPDATE_TOKEN_DATA');
const UPDATE_TOKEN_PROPS = createActionType('UPDATE_TOKEN_PROPS');
const CLEAR_CONFIRM_TRANSACTION = createActionType('CLEAR_CONFIRM_TRANSACTION');
const UPDATE_TRANSACTION_AMOUNTS = createActionType(
  'UPDATE_TRANSACTION_AMOUNTS',
);
const UPDATE_TRANSACTION_FEES = createActionType('UPDATE_TRANSACTION_FEES');
const UPDATE_TRANSACTION_TOTALS = createActionType('UPDATE_TRANSACTION_TOTALS');
const UPDATE_NONCE = createActionType('UPDATE_NONCE');

// Initial state
const initState = {
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

// Reducer
export default function reducer(state = initState, action = {}) {
  switch (action.type) {
    case UPDATE_TX_DATA:
      return {
        ...state,
        txData: {
          ...action.payload,
        },
      };
    case UPDATE_TOKEN_DATA:
      return {
        ...state,
        tokenData: {
          ...action.payload,
        },
      };
    case UPDATE_TOKEN_PROPS:
      return {
        ...state,
        tokenProps: {
          ...action.payload,
        },
      };
    case UPDATE_TRANSACTION_AMOUNTS: {
      const {
        fiatTransactionAmount,
        ethTransactionAmount,
        hexTransactionAmount,
      } = action.payload;
      return {
        ...state,
        fiatTransactionAmount:
          fiatTransactionAmount || state.fiatTransactionAmount,
        ethTransactionAmount:
          ethTransactionAmount || state.ethTransactionAmount,
        hexTransactionAmount:
          hexTransactionAmount || state.hexTransactionAmount,
      };
    }
    case UPDATE_TRANSACTION_FEES: {
      const { fiatTransactionFee, ethTransactionFee, hexTransactionFee } =
        action.payload;
      return {
        ...state,
        fiatTransactionFee: fiatTransactionFee || state.fiatTransactionFee,
        ethTransactionFee: ethTransactionFee || state.ethTransactionFee,
        hexTransactionFee: hexTransactionFee || state.hexTransactionFee,
      };
    }
    case UPDATE_TRANSACTION_TOTALS: {
      const { fiatTransactionTotal, ethTransactionTotal, hexTransactionTotal } =
        action.payload;
      return {
        ...state,
        fiatTransactionTotal:
          fiatTransactionTotal || state.fiatTransactionTotal,
        ethTransactionTotal: ethTransactionTotal || state.ethTransactionTotal,
        hexTransactionTotal: hexTransactionTotal || state.hexTransactionTotal,
      };
    }
    case UPDATE_NONCE:
      return {
        ...state,
        nonce: action.payload,
      };
    case 'SET_DETAILS_FOR_CONFIRM_TX': {
      return {
        ...state,
        sendTxDetailPerId: {
          ...state.sendTxDetailPerId,
          [action.payload.transactionId]: {
            amountMode: action.payload.amountMode,
            assetType: action.payload.assetType,
          },
        },
      };
    }
    case CLEAR_CONFIRM_TRANSACTION: {
      // Preserve amountModes
      return {
        ...initState,
        sendTxDetailPerId: state.sendTxDetailPerId,
      };
    }
    case actionConstants.COMPLETED_TX: {
      const { id } = action.value;
      const { [id]: _filteredTxDetail, ...newAmountModePerTx } =
        state.sendTxDetailPerId;
      return { ...state, sendTxDetailPerId: newAmountModePerTx };
    }
    default:
      return state;
  }
}

// Action Creators
export function updateTxData(txData) {
  return {
    type: UPDATE_TX_DATA,
    payload: txData,
  };
}

export function updateTokenData(tokenData) {
  return {
    type: UPDATE_TOKEN_DATA,
    payload: tokenData,
  };
}

export function updateTokenProps(tokenProps) {
  return {
    type: UPDATE_TOKEN_PROPS,
    payload: tokenProps,
  };
}

export function updateTransactionAmounts(amounts) {
  return {
    type: UPDATE_TRANSACTION_AMOUNTS,
    payload: amounts,
  };
}

export function updateTransactionFees(fees) {
  return {
    type: UPDATE_TRANSACTION_FEES,
    payload: fees,
  };
}

export function updateTransactionTotals(totals) {
  return {
    type: UPDATE_TRANSACTION_TOTALS,
    payload: totals,
  };
}

export function updateNonce(nonce) {
  return {
    type: UPDATE_NONCE,
    payload: nonce,
  };
}

export function updateTxDataAndCalculate(txData) {
  return (dispatch, getState) => {
    const state = getState();
    const currentCurrency = currentCurrencySelector(state);
    const conversionRate = conversionRateSelector(state);
    const nativeCurrency = getNativeCurrency(state);

    dispatch(updateTxData(txData));

    const { txParams: { value = '0x0', gas: gasLimit = '0x0' } = {} } = txData;

    // if the gas price from our infura endpoint is null or undefined
    // use the metaswap average price estimation as a fallback
    let { txParams: { gasPrice } = {} } = txData;
    if (!gasPrice) {
      gasPrice = getAveragePriceEstimateInHexWEI(state) || '0x0';
    }

    const fiatTransactionAmount = getValueFromWeiHex({
      value,
      fromCurrency: nativeCurrency,
      toCurrency: currentCurrency,
      conversionRate,
      numberOfDecimals: 2,
    });
    const ethTransactionAmount = getValueFromWeiHex({
      value,
      fromCurrency: nativeCurrency,
      toCurrency: nativeCurrency,
      conversionRate,
      numberOfDecimals: 6,
    });

    dispatch(
      updateTransactionAmounts({
        fiatTransactionAmount,
        ethTransactionAmount,
        hexTransactionAmount: value,
      }),
    );

    const hexTransactionFee = getHexGasTotal({ gasLimit, gasPrice });

    const fiatTransactionFee = getTransactionFee({
      value: hexTransactionFee,
      fromCurrency: nativeCurrency,
      toCurrency: currentCurrency,
      numberOfDecimals: 2,
      conversionRate,
    });
    const ethTransactionFee = getTransactionFee({
      value: hexTransactionFee,
      fromCurrency: nativeCurrency,
      toCurrency: nativeCurrency,
      numberOfDecimals: 6,
      conversionRate,
    });

    dispatch(
      updateTransactionFees({
        fiatTransactionFee,
        ethTransactionFee,
        hexTransactionFee,
      }),
    );

    const fiatTransactionTotal = addFiat(
      fiatTransactionFee,
      fiatTransactionAmount,
    );
    const ethTransactionTotal = addEth(ethTransactionFee, ethTransactionAmount);
    const hexTransactionTotal = sumHexes(value, hexTransactionFee);

    dispatch(
      updateTransactionTotals({
        fiatTransactionTotal,
        ethTransactionTotal,
        hexTransactionTotal,
      }),
    );
  };
}

export function setTransactionToConfirm(transactionId) {
  return (dispatch, getState) => {
    const state = getState();
    const unconfirmedTransactionsHash =
      unconfirmedTransactionsHashSelector(state);
    const transaction = unconfirmedTransactionsHash[transactionId];

    if (!transaction) {
      console.error(`Transaction with id ${transactionId} not found`);
      return;
    }

    if (transaction.txParams) {
      dispatch(updateTxDataAndCalculate(transaction));
      const { txParams } = transaction;

      if (txParams.data) {
        const { to: tokenAddress, data } = txParams;

        const tokenData = parseStandardTokenTransactionData(data);
        const tokens = getTokens(state);
        const currentToken = tokens?.find(({ address }) =>
          isEqualCaseInsensitive(tokenAddress, address),
        );

        dispatch(
          updateTokenProps({
            decimals: currentToken?.decimals,
            symbol: currentToken?.symbol,
          }),
        );
        dispatch(updateTokenData(tokenData));
      }

      if (txParams.nonce) {
        const nonce = hexToDecimal(txParams.nonce);

        dispatch(updateNonce(nonce));
      }
    } else {
      dispatch(updateTxData(transaction));
    }
  };
}

export function clearConfirmTransaction() {
  return {
    type: CLEAR_CONFIRM_TRANSACTION,
  };
}

export const updateTxValueIfMaxEthSettled = (
  dispatch,
  state,
  { gasFeeEstimates, gasEstimateType },
) => {
  const txId = state.confirmTransaction?.txData?.id;

  if (
    txId &&
    state.confirmTransaction.sendTxDetailPerId?.[txId]?.amountMode ===
      AMOUNT_MODES.MAX &&
    state.confirmTransaction.sendTxDetailPerId?.[txId]?.assetType ===
      AssetType.native
  ) {
    const selectedAccount = getSelectedAccount(state);
    const gasEstimationObject = getGasEstimationObject(
      state,
      { gasFeeEstimates, gasEstimateType },
      state.confirmTransaction.txData,
    );
    const hexMaximumTransactionFee =
      getMaximumGasTotalInHexWei(gasEstimationObject);

    const gasTotal = new Numeric(hexMaximumTransactionFee || '0x0', 16);
    const updatedAmount = addHexPrefix(
      new Numeric(selectedAccount.balance, 16).minus(gasTotal).toString(),
    );

    const transactionMeta = cloneDeep(state.confirmTransaction.txData);
    transactionMeta.txParams.value = updatedAmount;

    updateTransaction(transactionMeta, true)(dispatch, state);
  }
};
