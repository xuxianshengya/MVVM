import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';

// class Square extends React.Component {
//     render() {
//       return (
//         <button 
//             className="square"
//             onClick={()=>{this.props.onClick()}}
//         >
//           {this.props.value}
//         </button>
//       );
//     }
//   }

    class Son extends React.Component {
        render() {
            return (
                <div onClick={()=>{this.props.toFather("我是son")}}>我是son</div>
            )
        }
    }

    function Square(props){
        return(
            <button
                className="square"
                onClick={props.onClick}
            >
            {props.value}
            </button>
        )
    }
    

  
  class Board extends React.Component {

    renderSquare(i) {
      return <Square key={i} value={this.props.squares[i]} onClick={() => this.props.onClick(i)} />;
    }
  
    render() {
        return (
            <div>
                {
                    Array(3).fill(null).map((itemX,x)=>{
                        return (
                            <div key={x}  className="board-row">
                                {
                                    Array(3).fill(null).map((itemY,y)=>{
                                        return(
                                            this.renderSquare(x*3+y)                               
                                        )
                                    })
                                }
                                
                            </div>
                        )
                    })
                }
        
            </div>
        );
    }
  }
  
  class Game extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            history:[{
                squares:Array(9).fill(null)
            }],
            xIsNext:true,
            stepNumber:0,//正在查看那一项
            position:0,//位置
            isReverse:false,
            
        }
    }

    handleClick(i){
        const history = this.state.history.slice(0, this.state.stepNumber + 1)
        const current = history[this.state.stepNumber]//最新的历史记录
        const squares = current.squares.slice();
        if(calculateWinner(squares) || squares[i]){
            return;
        }
        squares[i] = this.state.xIsNext?"x":"o"
        this.setState({
            history:history.concat([{
                squares:squares,
                column:(i+1)%3 === 0?3:(i+1)%3,
                line:Math.ceil((i +1)/3)
            }]),
            stepNumber: history.length,
            xIsNext:!this.state.xIsNext,
        });
    }

    jumpTo(move){
        for (let i = 0; i < 9; i++) {
            document.getElementsByClassName('square')[i].style = "";
        }
        this.setState({
            stepNumber:move,
            xIsNext:(move%2) === 0
        })
    }

    reverse(){
        this.setState({
            isReverse:!this.state.isReverse
        })
    }    

    render() {
        const history = this.state.history
        const current  = history[this.state.stepNumber] //使用最新的历史记录来展示
        const winner = calculateWinner(current.squares)
        const moves = history.map((step, move) => {
            const desc = move ?
                `Go to move # ${move} 第${step.line}行 第${step.column}列`:
                'Go to game start';
                
            return (
                <li key={move} className={move === this.state.stepNumber?"active":""}> 
                    <button onClick={() => this.jumpTo(move)}>{desc}</button>
                </li>
            );
        });
        let num = 0
        for(let i of current.squares){
            if(i){
                num++
            }
        }
        let status;
        if(winner) {
            status = "Winner:" + winner.winner
            for(let i of winner.winIndex){
                document.getElementsByClassName('square')[i].style = "background: lightblue; color: #fff;";
            }
        } else {
            if(num === 9){
                status = "和局"
            }else{
                status = "Next player: " + (this.state.xIsNext ? "x" : "o")    
            }
        }
        // 
        return (
            <div className="game">
                <Son toFather={(i)=>{console.log(i)}}/>
                <div className="game-board">
                    <Board 
                        squares={current.squares}
                        onClick={(i)=> this.handleClick(i)}
                    />
                </div>
                <div className="game-info">
                    <div>{status}</div>
                    <ol>{this.state.isReverse?moves:moves.reverse()}</ol>
                    <div onClick={()=> this.reverse()} >反转</div>
                </div>
            </div>
        );
    }
  }
  
  // ========================================
  
  ReactDOM.render(
    <Game />,
    document.getElementById('root')
  );

  function calculateWinner(squares) {
    const lines = [
      [0, 1, 2],
      [3, 4, 5],
      [6, 7, 8],
      [0, 3, 6],
      [1, 4, 7],
      [2, 5, 8],
      [0, 4, 8],
      [2, 4, 6],
    ];
    for (let i = 0; i < lines.length; i++) {
        const [a, b, c] = lines[i];
        if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
            return {
                winner:squares[a],
                winIndex:lines[i]
            };
        }
    }
    return null;
  }
  