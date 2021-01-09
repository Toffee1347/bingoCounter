module.exports = class {
    constructor(minValue, maxValue) {
        this.min = minValue
        this.max = maxValue
        this.usedNumbers = []
        this.remainingNumbers = []
        for (let i = this.min; i <= this.max; i++) {
            this.remainingNumbers.push(i)
        }
    }
    draw() {
        if (this.remainingNumbers.length == 0) {
            this.cur = 'Empty'
            return 'Empty'
        }
        let num = this.remainingNumbers[Math.floor(Math.random() * this.remainingNumbers.length)]
        this.cur = num
        delete this.remainingNumbers[this.remainingNumbers.indexOf(num)]
        this.remainingNumbers = this.remainingNumbers.filter((el) => {return el != ''})
        this.usedNumbers.push(num)
        this.usedNumbers.sort((a, b) => {return a - b})
        return num
    }
    restart() {
        this.usedNumbers = []
        this.remainingNumbers = []
        for (let i = this.min; i <= this.max; i++) {
            this.remainingNumbers.push(i)
        }
    }
}