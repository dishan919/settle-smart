/** Comparator returns positive when a has higher priority. O(log n) insert/extract, O(1) peek. */
export default class MaxHeap {
  constructor(compare = (a, b) => a - b) {
    this.items = [];
    this.compare = compare;
  }
  size() {
    return this.items.length;
  }
  isEmpty() {
    return !this.size();
  }
  peek() {
    return this.items[0];
  }
  insert(value) {
    const a = this.items;
    a.push(value);
    let i = a.length - 1;
    while (i > 0) {
      const p = Math.floor((i - 1) / 2);
      if (this.compare(a[i], a[p]) <= 0) break;
      [a[i], a[p]] = [a[p], a[i]];
      i = p;
    }
  }
  extractMax() {
    if (this.isEmpty()) return undefined;
    const a = this.items,
      result = a[0],
      last = a.pop();
    if (a.length) {
      a[0] = last;
      let i = 0;
      while (true) {
        let best = i;
        for (const c of [i * 2 + 1, i * 2 + 2])
          if (c < a.length && this.compare(a[c], a[best]) > 0) best = c;
        if (best === i) break;
        [a[i], a[best]] = [a[best], a[i]];
        i = best;
      }
    }
    return result;
  }
}
