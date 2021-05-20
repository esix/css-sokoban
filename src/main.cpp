// g++ -std=c++11 main.cpp && ./a.out

#include <string>
#include <iostream>
#include <tuple>
#include <set>

using namespace std;

const char* RAW_LEVEL = "\n\
  ###\n\
  #.#\n\
  # ####\n\
###$ $.#\n\
#. $@###\n\
####$#\n\
   #.#\n\
   ###\n\
";


class Position {
public:
    Position() : _i(0), _j(0) {};
    Position(int i, int j): _i(i), _j(j) {};

private:
    int _i;
    int _j;
};


class Blocks {
public:
    bool add_block(const Position &position) {

    }
private:
    int _n;
    Position _positions[16];
};


class GameState {
private:
    Position _player;
    Blocks _blocks;
};


typedef struct {
    char walls[16][16];
    __int128 win;
    int num_blocks;
} level_t;

typedef struct { __int128 blocks; char player; } position_t;


bool make_level(const char* raw_level, level_t *level, position_t *position) {
    int i = 0, j = 0;

    for (i = 0; i < 16; i++) {
        for (j = 0; j < 16; j++) {
            level->walls[i][j] = 0;
        }
    }
    level->win = 0;
    level->num_blocks = 0;

    position->player = 0;
    position->blocks = 0;
    int num_blocks = 0;

    for (const char* c = raw_level; *c; c++) {
        char current_position = (i << 4) | j;
        switch (*c) {
            case ' ':
                j++;
                break;
            case '\n':
                i++;
                j = 0;
                if (i == 16) return false;
                break;
            case '@':
                position->player = current_position;
                j++;
                break;
            case '#':
            case '=':
                level->walls[i][j] = 1;
                j++;
                break;
            case '$':
                num_blocks++;
                if (num_blocks == 16) {
                    return false;
                position->blocks |= (__int128)current_position << (8 * (num_blocks - 1));
                }
                j++;
                break;
            case '.':
                level->num_blocks++;
                if (level->num_blocks == 16) {
                    return false;
                }
                level->win |= (__int128)current_position << (8 * (level->num_blocks - 1));
                j++;
                break;
            default:
                cout << "err" << *c << endl;
                return false;
        }
        if (j == 16) {
            return false;
        }
    }
    return true;
}


int main() {
    cout << RAW_LEVEL << endl;
    level_t level;
    position_t start;
    if (!make_level(RAW_LEVEL, &level, &start)) {
        return 1;
    }
    cout << RAW_LEVEL << endl;
    return 0;
}
