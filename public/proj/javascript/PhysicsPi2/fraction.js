function Fraction(val, den){
  this.numerator;
  this.denominator;
  this.val
  
  if(den !== undefined){
    this.numerator = val;
    this.denominator = den;
  }else{
    if(typeof val === 'string' || val instanceof String){
      valArr = val.split("/");
      this.numerator = int(valArr[0]);
      this.denominator = int(valArr[1]);
    }else if(val instanceof Fraction){
      this.numerator = val.numerator;
      this.denominator = val.denominator;
    }else{
      this.numerator = Math.round(val);
      this.denominator = 1;
    }
  }
  
  this.simplify = function(){
    if(this.denominator === 0){
      this.val = undefined;
      return;
    }
    gcdA = gcd(this.numerator,this.denominator);
    this.numerator /= gcdA;
    this.denominator /= gcdA;
    
    this.val = this.numerator/this.denominator;
  }
  this.simplify();
  this.mult = function(other){
    this.numerator *= other.numerator;
    this.denominator *= other.denominator;
    this.simplify();
    return this;
  }
  this.div = function(other){
    this.numerator *= other.denominator;
    this.denominator *= other.numerator;
    this.simplify();
    return this;
  }
  this.add = function(other){
    this.numerator = (this.numerator * other.denominator) + (other.numerator * this.denominator);
    this.denominator = this.denominator * other.denominator;
    this.simplify();
    return this;
  }
  this.sub = function(other){
    this.numerator = (this.numerator * other.denominator) - (other.numerator * this.denominator);
    this.denominator = this.denominator * other.denominator;
    this.simplify();
    return this;
  }
  this.multnew = function(other){
    return this.copy().mult(other);
  }
  this.divnew = function(other){
    return this.copy().div(other);
  }
  this.addnew = function(other){
    return this.copy().add(other);
  }
  this.subnew = function(other){
    return this.copy().sub(other);
  }
  this.copy = function(){
    var n = new Fraction(this);
    return n;
  }
  this.set = function(other){
    if(typeof other === "number"){
      this.numerator = other;
      this.denominator = 1;
    }else{ //Assumes other is instance of Fraction
      this.numerator = other.numerator;
      this.denominator = other.denominator;
    }
    this.simplify();
    return this;
  }
  
  
  this.toString = function(doDiv){
    if(doDiv){
      return this.numerator/this.denominator
    }
    return this.numerator + "/" + this.denominator;
  }
}
var gcd = function gcd(a,b){
  return b ? gcd(b, a%b) : a;
};