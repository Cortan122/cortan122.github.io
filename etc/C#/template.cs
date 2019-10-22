using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

/// <summary>
/// Задание с Экзаменационной Контрольной Работы №1
/// </summary>
/// <remarks>
/// <para>Автор: Борисов Костя</para>
/// <para>Группа: БПИ199</para>
/// <para>Дата: 23.10.2019</para>
/// <para>Вариант: 0</para>
/// </remarks>
namespace Шаблон {
  class Program {
    /// <summary>
    /// Считавыет целое число с stdin, и проверяет попадает ли оно в отрезок [lowerBound,upperBound].
    /// Если число неправильное, просит ввести его повторно.
    /// </summary>
    /// <returns>
    /// Введенное число.
    /// </returns>
    /// <param name="name">Название этого числа.</param>
    /// <param name="lowerBound">Минимально возможное значение числа.</param>
    /// <param name="upperBound">Максимально возможное значение числа.</param>
    static int ReadInt(string name, int lowerBound = int.MinValue, int upperBound = int.MaxValue) {
      int r;
      do {
        string tempstr1 = lowerBound != int.MinValue? lowerBound + " <= ": "";
        string tempstr2 = upperBound != int.MaxValue? " <= " + upperBound: "";
        Console.Write($"Введите {name} ({tempstr1}int{tempstr2}): ");
      } while (!int.TryParse(Console.ReadLine(), out r) || r < lowerBound || r > upperBound);
      Log($"{name} = {r}");
      return r;
    }

    /// <summary>
    /// Считавыет символ с stdin, и проверяет попадает ли оно в отрезок [lowerBound,upperBound].
    /// Если символ неправильный, просит ввести его повторно.
    /// </summary>
    /// <returns>
    /// Введенный символ.
    /// </returns>
    /// <param name="name">Название этого символа.</param>
    /// <param name="lowerBound">Минимально возможное значение символа.</param>
    /// <param name="upperBound">Максимально возможное значение символа.</param>
    static char ReadChar(string name, char lowerBound = char.MinValue, char upperBound = char.MaxValue) {
      char r;
      do {
        string tempstr1 = lowerBound != char.MinValue? lowerBound + " <= ": "";
        string tempstr2 = upperBound != char.MaxValue? " <= " + upperBound: "";
        Console.Write($"Введите {name} ({tempstr1}char{tempstr2}): ");
      } while (!char.TryParse(Console.ReadLine(), out r) || r < lowerBound || r > upperBound);
      Log($"{name} = {r}");
      return r;
    }

    /// <summary>
    /// Считавыет действительное число с stdin, и проверяет попадает ли оно в отрезок [lowerBound,upperBound].
    /// Если число неправильное, просит ввести его повторно.
    /// </summary>
    /// <returns>
    /// Введенное число.
    /// </returns>
    /// <param name="name">Название этого числа.</param>
    /// <param name="lowerBound">Минимально возможное значение числа.</param>
    /// <param name="upperBound">Максимально возможное значение числа.</param>
    static double ReadDouble(string name, double lowerBound = double.MinValue, double upperBound = double.MaxValue) {
      double r;
      do {
        string tempstr1 = lowerBound != double.MinValue? lowerBound + " <= ": "";
        string tempstr2 = upperBound != double.MaxValue? " <= " + upperBound: "";
        Console.Write($"Введите {name} ({tempstr1}double{tempstr2}): ");
      } while (!double.TryParse(Console.ReadLine(), out r) || r < lowerBound || r > upperBound);
      Log($"{name} = {r}");
      return r;
    }

    // Перегрузка наслучай, если нет name.
    static int ReadInt(int lowerBound = int.MinValue, int upperBound = int.MaxValue) {
      return ReadInt("целое число", lowerBound, upperBound);
    }

    // Перегрузка наслучай, если нет name.
    static char ReadChar(char lowerBound = char.MinValue, char upperBound = char.MaxValue) {
      return ReadChar("символ", lowerBound, upperBound);
    }

    // Перегрузка наслучай, если нет name.
    static double ReadDouble(double lowerBound = double.MinValue, double upperBound = double.MaxValue) {
      return ReadDouble("действительное число", lowerBound, upperBound);
    }

    /// <summary>
    /// Запускает f() и предлогает пользователю повторить.
    /// </summary>
    static void Loop(Action f, bool forever = false) {
      while (true) {
        f();
        if (forever)continue;
        // if Console.IsOutputRedirected is True Console.ReadKey() throws an exeption
        if (Console.IsOutputRedirected)return;
        Console.WriteLine("Нажмите Enter чтобы повторить");
        if (Console.ReadKey().Key != ConsoleKey.Enter)break;
      }
    }

    /// <summary>
    /// Безопасно совершает некую операцию f() над какимто файлом.
    /// Если произошла ошибка вызывает error(ошибка) или (если error == null) завершает программу.
    /// </summary>
    static T CatchFileExeptions<T>(Func<T> f, Action<string> error = null) {
      if (error == null)error = (e) => {
        Console.WriteLine(e);
        Log("FileExeption: " + e);
        Exit();
      };
      try {
        return f();
      } catch (FileNotFoundException) {
        error("Файл не существует");
      } catch (IOException) {
        error("Ошибка ввода-вывода");
      } catch (System.Security.SecurityException) {
        error("Ошибка безопасности");
      } catch (UnauthorizedAccessException) {
        error("У вас нет разрешения на создание/чтение файла");
      }
      return default(T);
    }

    // Перегрузка наслучай, если f ничего не возвращает.
    static void CatchFileExeptions(Action f, Action<string> error = null) {
      CatchFileExeptions(() => { f(); return 1; }, error);
    }

    static readonly string logFilePath = CatchFileExeptions(() => {
      // if we are compiled with VS $pwd is going to end in "Debug"
      // and we need to create log.txt in the sln directory
      if (Directory.GetCurrentDirectory().EndsWith("Debug"))return "../../../log.txt";
      // but if we are compiled with mono we can just create it in $pwd
      return "log.txt";
    });

    /// <summary>
    /// Записавает строку в log.txt.
    /// </summary>
    static void Log(string s, bool alsoLogToConsole = false) {
      if (alsoLogToConsole)Console.WriteLine(s);
      CatchFileExeptions(() => File.AppendAllText(logFilePath, s + Environment.NewLine));
    }

    static void Exit() {
      Log("exiting");
      Environment.Exit(0);
    }

    /// <summary>
    /// Предлогает пользователю выбрать одну из функций в funcs и вызывает выбраную функцию.
    /// </summary>
    static void Menu(Action[] funcs) {
      Console.WriteLine("Выберите функцию");
      for (var i = 0; i < funcs.Length; i++) {
        Console.WriteLine($"{i+1}. {funcs[i].Method.Name}");
      }
      var ind = ReadInt("номер функции", 1, funcs.Length) - 1;
      funcs[ind]();
    }

    static Random rng = new Random();

    static void Main() {
      Log("starting");
      Loop(() => {
        var n = ReadInt(1, 1000);
        Console.WriteLine(n);
        Menu(new Action[]{Exit});
        // your code goes here
      });
      Exit();
    }
  }
}
