import React, { Component } from 'react';

export default class Circle extends Component {

    constructor(props) {
        super(props);

        //  CONSTANTS
        const _width = window.innerWidth;
        const _height = window.innerHeight;

        const min = -5; const max = 5;
        const velocityRate = 0.2;
        this.vx = velocityRate * (Math.random() * (max-min+1) + min);
        this.vy = velocityRate * (Math.random() * (max-min+1) + min);

        // state vars are used to render the obj. changes after mounting
        this.state = {
            x: Math.random() * _width,
            y: Math.random() * _height,
        };

        this.r = (props.alpha ?? 0.007) * (_width + _height);
    }
    
    move() {
        // this.setState((params) => {function, return sth});
        // setState: can only pass one param, so x and y --> {x, y}
        this.setState(({ x, y }) => {
            // update position
            x += this.vx; y += this.vy;

            // bouncing logic if reached side of screen
            if (x + this.r >= window.innerWidth) {
                x = window.innerWidth - this.r; this.vx *= -1;
            } else if (x - this.r < 0) {
                x = this.r; this.vx *= -1;
            }
            if (y + this.r >= window.innerHeight) {
                y = window.innerHeight - this.r; this.vy *= -1;
            } else if (y - this.r < 0) {
                y = this.r; this.vy *= -1;
            }

            return { x, y };
        });
    }

    // this function only runs once. used to set timers using setInterval.
    componentDidMount() {
        // https://www.reddit.com/r/learnreactjs/comments/agdziy/explain_to_me_how_componentdidmount_works/
        // The setIneterval is kicked off in that function, and setInterval works gets continuously called. 
        // each time the setState function runs, the state is updated and the render method is called again 
        // (hence the componentDidUpdate function continuously getting called)
        this.interval = setInterval(() => { this.move(); }, 16);
        // () => {} wraps it so setInterval gets a function to call repeatedly, not the result of calling it once.
    }

    // invoked just before a component is unmounted and destroyed.
    componentWillUnmount() {
        // https://www.geeksforgeeks.org/reactjs/reactjs-componentwillunmount-method/
        // This method is the perfect place to perform any necessary cleanup, such as:
        // Clearing timers (like setInterval() or setTimeout())
        clearInterval(this.interval);
    }

    // React re-renders all components every time setState is called
    // https://stackoverflow.com/questions/24718709/reactjs-does-render-get-called-any-time-setstate-is-called
    render() {
    const { x, y } = this.state;
    const size = this.r * 2;
    return (
        <div style={{
            position: 'fixed',
            left: x - this.r,
            top: y - this.r,
            width: size,
            height: size,
            borderRadius: '50%',
            backgroundImage: 'radial-gradient(circle at 20% 30%, rgba(255, 235, 185, 0.64) 0%, transparent 30%)',
            backgroundColor: 'rgba(255, 255, 234, 0.42)',
            pointerEvents: 'none',
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
        }}>
            <img
                src={this.props.image}
                alt=""
                style={{
                    width: '75%',
                    height: '75%',
                    objectFit: 'contain',
                    animation: 'spinNote 3s linear infinite',
                    opacity: 1.0,
                }}
            />
            </div>
        );
    }
}