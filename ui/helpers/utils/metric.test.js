import {
  BlockaidReason,
  BlockaidResultType,
} from '../../../shared/constants/security-provider';
import { getBlockaidMetricsParams, getMethodName } from './metrics';

describe('getMethodName', () => {
  it('should get correct method names', () => {
    expect(getMethodName(undefined)).toStrictEqual('');
    expect(getMethodName({})).toStrictEqual('');
    expect(getMethodName('confirm')).toStrictEqual('confirm');
    expect(getMethodName('balanceOf')).toStrictEqual('balance Of');
    expect(getMethodName('ethToTokenSwapInput')).toStrictEqual(
      'eth To Token Swap Input',
    );
  });
});

describe('getBlockaidMetricsParams', () => {
  it('should return empty object when securityAlertResponse is not defined', () => {
    const result = getBlockaidMetricsParams(undefined);
    expect(result).toStrictEqual({});
  });

  it('should return additionalParams object when securityAlertResponse defined', () => {
    const securityAlertResponse = {
      result_type: BlockaidResultType.Malicious,
      reason: BlockaidReason.notApplicable,
      providerRequestsCount: {
        eth_call: 5,
        eth_getCode: 3,
      },
      features: [],
    };

    const result = getBlockaidMetricsParams(securityAlertResponse);
    expect(result).toStrictEqual({
      ui_customizations: ['flagged_as_malicious'],
      security_alert_response: BlockaidResultType.Malicious,
      security_alert_reason: BlockaidReason.notApplicable,
      ppom_eth_call_count: 5,
      ppom_eth_getCode_count: 3,
    });
  });

  it('returns additionalParams object when result_type is Errored', () => {
    const securityAlertResponse = {
      result_type: BlockaidResultType.Errored,
      reason: 'error: error message',
      providerRequestsCount: {},
      features: [],
    };

    const result = getBlockaidMetricsParams(securityAlertResponse);
    expect(result).toStrictEqual({
      ui_customizations: ['security_alert_error'],
      security_alert_response: BlockaidResultType.Errored,
      security_alert_reason: 'error: error message',
    });
  });

  it('should not return eth call counts if providerRequestsCount is empty', () => {
    const securityAlertResponse = {
      result_type: BlockaidResultType.Malicious,
      reason: BlockaidReason.notApplicable,
      features: [],
      providerRequestsCount: {},
    };

    const result = getBlockaidMetricsParams(securityAlertResponse);
    expect(result).toStrictEqual({
      ui_customizations: ['flagged_as_malicious'],
      security_alert_response: BlockaidResultType.Malicious,
      security_alert_reason: BlockaidReason.notApplicable,
    });
  });

  it('should not return eth call counts if providerRequestsCount is undefined', () => {
    const securityAlertResponse = {
      result_type: BlockaidResultType.Malicious,
      reason: BlockaidReason.notApplicable,
      features: [],
      providerRequestsCount: undefined,
    };

    const result = getBlockaidMetricsParams(securityAlertResponse);
    expect(result).toStrictEqual({
      ui_customizations: ['flagged_as_malicious'],
      security_alert_response: BlockaidResultType.Malicious,
      security_alert_reason: BlockaidReason.notApplicable,
    });
  });
});
