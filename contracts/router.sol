//SPDX-License-Identifier: UNLICENSED
pragma solidity 0.6.12;
pragma experimental ABIEncoderV2;

import "./staking.sol";

contract Treasury is Ownable { 

    event Deposit(address from, uint amount);

    address public atariAddress;
    constructor(address _atariAddress) public {
        atariAddress = _atariAddress;
    }

    function withdraw(address to, uint amount) external onlyOwner {
        ERC20 AtariToken = ERC20(atariAddress);
        AtariToken.transfer(to, amount);
    }

    function deposit( uint amount) external {
        ERC20 AtariToken = ERC20(atariAddress);
        AtariToken.transferFrom(msg.sender, address(this), amount);
        emit Deposit(msg.sender, amount);
    }
}

contract StakingRouter is Ownable{

    event AdminChanged(address admin, address newAdmin);
    event GameCreated(address stakingPoolAddress, GameInfo _gameInfo);
    
    event GameWin(uint gameID,uint amount);
    event GameLose(uint gameID,uint amount);

    address public admin;
    address public treasury;
    address public atariAddress;

    address[] public games;
    mapping(address => uint) public gameIds;

    constructor(address _admin, address _atariAddress) public {
        admin = _admin;
        atariAddress = _atariAddress;

        Treasury _treasury = new Treasury(atariAddress);
        treasury = address(_treasury);
    }

    function create(GameInfo memory _gameInfo) public {

        StakingPool newGame = new StakingPool(_gameInfo, atariAddress);

        gameIds[address(newGame)] = games.length;
        games.push(address(newGame));
        
        emit GameCreated(address(newGame),_gameInfo);
    }
    /* ------------- admin actions ------------- */
    
    function gameWin(uint gameId, uint amount) public onlyAdmin{
        require(games[gameId] != address(0), "Invalide game ID");
        
        StakingPool game = StakingPool(games[gameId]);
        Treasury _treasury = Treasury(treasury);

        _treasury.withdraw(address(game),amount);
        emit GameWin(gameId, amount);
    }

    function gameLose(uint gameId, uint amount) public onlyAdmin{
        require(games[gameId] != address(0), "Invalide game ID");
        
        StakingPool game = StakingPool(games[gameId]);
        Treasury _treasury = Treasury(treasury);

        game.gameWithdraw(address(_treasury),amount);
        emit GameLose(gameId, amount);
    }

    function withdraw(address to, uint amount) public onlyAdmin{
        Treasury _treasury = Treasury(treasury);
        _treasury.withdraw(to, amount);
    }

    function batchWithdraw(address[] memory tos, uint[] memory amounts) external onlyAdmin{
        uint length = tos.length;
        require(amounts.length == length,"Request parameter not valid");
        for (uint i = 0; i < length; i++){
            withdraw(tos[i],amounts[i]);
        }
    }
    /* ------------- ownable ------------- */

    function changeAdmin(address newAdmin) external {
        emit AdminChanged(admin, newAdmin);
        admin = newAdmin;
    }

    modifier onlyAdmin(){
        require(admin == _msgSender(), "Factory: caller is not the admin");
        _;
    }

    /* ------------- view ------------ */
    function totalGames() external view returns (uint) {
        return games.length;
    }

    function stakingInfos(uint[] memory ids) external view returns(address[] memory pools, GameInfo[] memory infos) {
        pools = new address[](ids.length);
        infos = new GameInfo[](ids.length);

        for (uint i = 0; i < ids.length; i ++) {
            pools[i] = games[i];
            infos[i] = StakingPool(pools[i]).getGameInfo();
        }
    }
}