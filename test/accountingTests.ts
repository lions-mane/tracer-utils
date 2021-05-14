import { expect } from 'chai';
import { 
  calcTradeExposure,
  calcBorrowed,
  calcTotalMargin,
  calcMinimumMargin,
  calcWithdrawable,
  calcNotionalValue,
  calcLeverage,
  calcLiquidationPrice,
  calcProfitableLiquidationPrice,
} from "../src/Accounting"


// Basic positions
// The user holds a position not in liquidation
// Deposit 200 at $100, short 10 units
const position1 = {
  quote: 1200, base: -10, price: 100, maxLeverage: 50
}
// 25 leverage
const position2 = {
  quote: -9600, base: 100, price: 100, maxLeverage: 50
}
// Invalid positions
// The user holds a position and can be liquidated
// no margin
const invalid1 = {
  quote: -1000, base: 10, price: 100, maxLeverage: 50
}
// not enough margin due to liquidation gas prices
// is actually a valid position otherwise
const invalid2 = {
  quote: 2050, base: -20, price: 100, maxLeverage: 50
}

const orders = [
    {
        amount: 10,
        price: 1
    }, 
    {
        amount: 20,
        price: 1.1
    }, 
    {
        amount: 30,
        price: 1.2
    }
]

describe('calcTradeExposure', () => {
  it('no orders', () => {
    const { exposure, slippage, tradePrice } = calcTradeExposure(0, 1, [])
    expect(exposure).to.equal(0);
    expect(slippage).to.equal(0);
    expect(tradePrice).to.equal(0);
  });

  it('no margin, no exposure', () => {
    const { exposure, slippage, tradePrice } = calcTradeExposure(0, 1, orders)
    expect(exposure).to.equal(0);
    expect(slippage).to.equal(0);
    expect(tradePrice).to.equal(1);
  });
  it('quote <= order[0].notional', () => {
    const { exposure, slippage, tradePrice } = calcTradeExposure(10, 1, orders)
    expect(exposure).to.equal(10);
    expect(slippage).to.equal(0)
    expect(tradePrice).to.equal(1);

  });
  it('order[0].notional <= quote <= order[1].notional', () => {
    const { exposure, slippage, tradePrice } = calcTradeExposure(20, 1, orders)
    expect(exposure).to.equal(19.0909090909);
    // actual paid price === 1.05
    expect(slippage).to.approximately(0.05, 0.00001)
    expect(tradePrice).to.equal(1.05);
  });
  it('takes all orders', () => {
    // here we are taking 10 orders at 1, 20 at 1.1 and 30 at 1.2
    // round 1 60 - 10 (at $1)
        // 68 - 10 = 58 left over
    // round 2 20 (at $1.1)
        // 58 - (20 * 1.1) = 36 left over
    // round 3 30 at ($1.2)
        // 36 - (30 * 1.2) - 0 left over
    // price should be (10 * 1 + 20 * 1.1 + 30 * 1.2) / 60
    // trade price at 1.133333333
    const { exposure, slippage, tradePrice } = calcTradeExposure(68, 1, orders)
    expect(exposure).to.equal(68)
    expect(slippage).to.approximately(0.133333, 0.00001)
    // 10 0's
    expect(tradePrice).to.equal(1.1333333333333333);
  });
  it('takes all orders and beyond', () => {
    // should be same as above
    const { exposure, slippage, tradePrice } = calcTradeExposure(300, 1, orders)
    expect(exposure).to.equal(68)
    expect(slippage).to.approximately(0.133333, 0.00001)
    // 10 0's
    expect(tradePrice).to.equal(1.1333333333333333);
  });
  it('takes all orders with leverage', () => {
    // should be same as above
    const { exposure, slippage, tradePrice } = calcTradeExposure(34, 2, orders)
    expect(exposure).to.equal(68)
    expect(slippage).to.approximately(0.133333, 0.00001)
    // 10 0's
    expect(tradePrice).to.equal(1.1333333333333333);
  });
});

describe("Testing margin", () => {
  it('Basic Positions', () => {
    expect(calcTotalMargin(position1.quote, position1.base, position1.price), 'Position 1').to.equal(200)
    expect(calcTotalMargin(position2.quote, position2.base, position2.price), 'Position 2').to.equal(400)
  })
  it('Invalid Positions', () => {
    expect(calcTotalMargin(invalid1.quote, invalid1.base, invalid1.price), 'Invalid 1').to.equal(0)
    expect(calcTotalMargin(invalid2.quote, invalid2.base, invalid2.price), 'Invalid 2').to.equal(50)
  })
})

describe("Testing calcNotional", () => {
  it('Basic Position', () => {
    expect(calcNotionalValue(position1.base, position1.price), "Position 1").to.equal(1000)
    expect(calcNotionalValue(position2.base, position2.price), 'Position 2').to.equal(10000)
  })
  it('Invalid Positions', () => {
    expect(calcNotionalValue(invalid1.base, invalid1.price), 'Invalid 1').to.equal(1000)
    expect(calcNotionalValue(invalid2.base, invalid2.price), 'Invalid 2').to.equal(2000)
  })
})

describe("Testing Minimum margin", () => {
  it('Basic Positions', () => {
    expect(calcMinimumMargin(position1.quote, position1.base, position1.price, position1.maxLeverage), 'Position 1').to.equal(170)
    expect(calcMinimumMargin(position2.quote, position2.base, position2.price, position2.maxLeverage), 'Position 2').to.equal(350)
  })
  it('Invalid Positions', () => {
    expect(calcMinimumMargin(invalid1.quote, invalid1.base, invalid1.price, invalid1.maxLeverage), 'Invalid 1').to.equal(170)
    expect(calcMinimumMargin(invalid2.quote, invalid2.base, invalid2.price, invalid2.maxLeverage), 'Invalid 2').to.equal(190)
  })
})

describe("Testing calcBorrowed", () => {
  it('Basic Positions', () => {
    expect(calcBorrowed(position1.quote, position1.base, position1.price), 'Position 1').to.equal(800)
    expect(calcBorrowed(position2.quote, position2.base, position2.price), 'Position 2').to.equal(9600)
  })
  it('Invalid Positions', () => {
    expect(calcBorrowed(invalid1.quote, invalid1.base, invalid1.price), 'Invalid 1').to.equal(1000)
    expect(calcBorrowed(invalid2.quote, invalid2.base, invalid2.price), 'Invalid 2').to.equal(1950)
  })
})

describe("Testing calcLeverage", () => {
  it('Basic Positions', () => {
    expect(calcLeverage(position1.quote, position1.base, position1.price), 'Position 1').to.equal(5)
    expect(calcLeverage(position2.quote, position2.base, position2.price), 'Position 2').to.equal(25)
  })
  it('Invalid Positions', () => {
    expect(calcLeverage(invalid1.quote, invalid1.base, invalid1.price), 'Invalid 1').to.equal(-1)
    expect(calcLeverage(invalid2.quote, invalid2.base, invalid2.price), 'Invalid 2').to.equal(40)
  })
})

describe("Testing liquidationPrice", () => {
  it('Basic Positions', () => {
    expect(calcLiquidationPrice(position1.quote, position1.base, position1.price, position1.maxLeverage), "Position 1").to.approximately(102.941, 0.001)
    expect(calcLiquidationPrice(position2.quote, position2.base, position2.price, position2.maxLeverage), 'Position 2').to.approximately(99.490, 0.001)
  })
  it('Invalid Positions', () => {
    // since this is long they are already in liquidation
    expect(calcLiquidationPrice(invalid1.quote, invalid1.base, invalid1.price, invalid1.maxLeverage), 'Invalid 1').to.approximately(117.347, 0.001)
    expect(calcLiquidationPrice(invalid2.quote, invalid2.base, invalid2.price, invalid2.maxLeverage), 'Invalid 2').to.approximately(93.137, 0.001)
  })
})

describe("Testing profitableForLiquidationPrice", () => {
  it('Basic Positions', () => {
    expect(calcProfitableLiquidationPrice(position1.quote, position1.base, position1.price, position1.maxLeverage), "Position 1").to.approximately(105.392, 0.001)
    expect(calcProfitableLiquidationPrice(position2.quote, position2.base, position2.price, position2.maxLeverage), 'Position 2').to.approximately(99.235, 0.001)
  })
  it('Invalid Positions', () => {
    // since this is long they are already in liquidation
    expect(calcProfitableLiquidationPrice(invalid1.quote, invalid1.base, invalid1.price, invalid1.maxLeverage), 'Invalid 1').to.approximately(114.796, 0.001)
    expect(calcProfitableLiquidationPrice(invalid2.quote, invalid2.base, invalid2.price, invalid2.maxLeverage), 'Invalid 2').to.approximately(94.363, 0.001)
  })
})

describe('Testing Withdrawable', () => {
  it('Basic Positions', () => {
    expect(calcWithdrawable(position1.quote, position1.base, position1.price, position1.maxLeverage), 'Position 1').to.equal(30)
    expect(calcWithdrawable(position2.quote, position2.base, position2.price, position2.maxLeverage), 'Position 2').to.equal(50)
  })
  it('Invalid Positions', () => {
    // they cannot withdraw anything
    expect(calcWithdrawable(invalid1.quote, invalid1.base, invalid1.price, invalid1.maxLeverage), 'Invalid 1').to.equal(-170)
    expect(calcWithdrawable(invalid2.quote, invalid2.base, invalid2.price, invalid2.maxLeverage), 'Invalid 2').to.equal(-140)
  })
})
